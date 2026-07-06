import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const { Pool } = pg;

const app = express();

// --- ENV ---
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SECRET_URL = process.env.ADMIN_SECRET_URL;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

if (!JWT_SECRET || !ADMIN_SECRET_URL || !ADMIN_SECRET_KEY) {
    console.error('FATAL: JWT_SECRET, ADMIN_SECRET_URL, and ADMIN_SECRET_KEY must be set in env');
    process.exit(1);
}
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_SSL = process.env.DATABASE_SSL !== 'false' && !DATABASE_URL?.includes('sslmode=disable');
const INIT_DB_TOKEN = process.env.INIT_DB_TOKEN || '';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

// --- DB ---
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL && DATABASE_SSL ? { rejectUnauthorized: false } : false
});

// SQL helper: convert ? to $1,$2,...
const q = (sql, params = []) => {
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    return pool.query(pgSql, params);
};
const dbRun = async (sql, params = []) => { const r = await q(sql, params); return { lastID: 0, changes: r.rowCount }; };
const dbGet = async (sql, params = []) => { const r = await q(sql, params); return r.rows[0]; };
const dbAll = async (sql, params = []) => { const r = await q(sql, params); return r.rows; };

// Helper to log admin/developer actions
const logAction = async (adminId, action, targetUserId, details, ip = '127.0.0.1') => {
    try {
        await dbRun('INSERT INTO admin_logs (admin_id, action, target_user_id, details, ip_address) VALUES (?, ?, ?, ?, ?)',
            [adminId || 0, action, targetUserId || null, details || '', ip]);
    } catch (e) {
        console.error('Failed to log action:', e);
    }
};

// --- MIDDLEWARE ---
app.use(cors({
    origin: CORS_ORIGINS.length ? CORS_ORIGINS : '*',
    credentials: false
}));
app.use(express.json());

const requestBuckets = new Map();
const rateLimit = ({ keyPrefix, limit, windowMs }) => (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}:${String(req.body?.login || req.body?.email || req.body?.code || '').toLowerCase()}`;
    const now = Date.now();
    const bucket = requestBuckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    requestBuckets.set(key, bucket);

    if (bucket.count > limit) {
        return res.status(429).json({ error: 'РЎР»РёС€РєРѕРј РјРЅРѕРіРѕ РїРѕРїС‹С‚РѕРє. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.' });
    }

    next();
};

const ROLE_ALIASES = {
    manager: 'operator',
    hr: 'admin',
    partner: 'client'
};

const normalizeRole = (role) => ROLE_ALIASES[role] || role || 'client';
const roleMatches = (role, allowed) => allowed.includes(role) || allowed.includes(normalizeRole(role));

const requireRoles = (allowed) => (req, res, next) => {
    if (!roleMatches(req.user?.role, allowed)) {
        return res.status(403).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });
    }
    next();
};

const requireBackoffice = requireRoles(['developer', 'admin', 'support', 'operator', 'ai']);
const requireUserAdmin = requireRoles(['developer', 'admin']);
const requireCatalogManager = requireRoles(['developer', 'admin', 'operator']);
const requireOrderManager = requireRoles(['developer', 'admin', 'operator']);
const requireChatStaff = requireRoles(['developer', 'admin', 'support', 'operator']);
const requireSupportManager = requireRoles(['developer', 'admin', 'support']);

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await dbGet('SELECT id, email, role, company_name, is_active FROM users WHERE id = ?', [decoded.id]);
        if (!user || user.is_active !== 1) {
            return res.status(403).json({ error: 'РђРєРєР°СѓРЅС‚ РґРµР°РєС‚РёРІРёСЂРѕРІР°РЅ' });
        }
        req.user = {
            ...decoded,
            id: user.id,
            email: user.email,
            role: user.role,
            normalizedRole: normalizeRole(user.role),
            company: user.company_name
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'РЎРµСЃСЃРёСЏ РёСЃС‚РµРєР»Р°' });
        return res.status(403).json({ error: 'РќРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅС‹Р№ С‚РѕРєРµРЅ' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!roleMatches(req.user.role, ['developer', 'admin', 'support', 'operator', 'ai'])) {
        return res.status(403).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });
    }
    next();
};

const requireDeveloper = (req, res, next) => {
    if (normalizeRole(req.user.role) !== 'developer') {
        return res.status(403).json({ error: 'Р”РѕСЃС‚СѓРї СЂР°Р·СЂРµС€С‘РЅ С‚РѕР»СЊРєРѕ СЂР°Р·СЂР°Р±РѕС‚С‡РёРєР°Рј' });
    }
    next();
};

const requireActiveAccount = async (req, res, next) => {
    try {
        const user = await dbGet('SELECT is_active FROM users WHERE id = ?', [req.user.id]);
        if (!user || user.is_active !== 1) return res.status(403).json({ error: 'РђРєРєР°СѓРЅС‚ РґРµР°РєС‚РёРІРёСЂРѕРІР°РЅ' });
        next();
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
};

const sanitizeUser = (u) => {
    if (!u) return null;
    return {
        id: u.id,
        email: u.email,
        role: u.role,
        normalizedRole: normalizeRole(u.role),
        companyName: u.company_name,
        company_name: u.company_name,
        contactPerson: u.contact_person,
        contact_person: u.contact_person,
        phone: u.phone,
        address: u.address,
        isActive: u.is_active === 1,
        is_active: u.is_active === 1 ? 1 : 0,
        mustChangePassword: !!u.must_change_password,
        must_change_password: !!u.must_change_password,
        createdAt: u.created_at,
        created_at: u.created_at,
        lastLogin: u.last_login
    };
};

const createOtpForUser = async (userId, createdBy) => {
    await dbRun('UPDATE otp_codes SET used = true WHERE user_id = ? AND used = false', [userId]);
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await dbRun('INSERT INTO otp_codes (code, user_id, created_by, expires_at) VALUES (?, ?, ?, ?)',
        [code, userId, createdBy, expires_at]);

    return { code, expires_at };
};

const formatCartItem = (item) => {
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);
    return {
        id: item.id,
        product_id: item.product_id,
        productId: item.product_id,
        product_name: item.product_name,
        productName: item.product_name,
        stock: Number(item.stock || 0),
        quantity,
        price,
        total: price * quantity
    };
};

const formatCartResponse = (items) => {
    const normalizedItems = items.map(formatCartItem);
    return {
        success: true,
        items: normalizedItems,
        totalItems: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
        total: normalizedItems.reduce((sum, item) => sum + item.total, 0)
    };
};

const formatChatMessage = (message) => {
    if (!message) return null;
    const senderRole = message.sender_type === 'user'
        ? 'user'
        : message.sender_type === 'operator' || message.sender_type === 'system'
            ? 'operator'
            : 'ai';
    return {
        ...message,
        role: senderRole,
        content: message.message,
        timestamp: message.created_at
    };
};

const formatOrderItem = (item) => ({
    ...item,
    productName: item.product_name,
    productId: item.product_id
});

const formatOrder = (order, items = []) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    totalAmount: Number(order.total_amount || 0),
    total_amount: order.total_amount,
    itemsCount: order.items_count,
    items_count: order.items_count,
    deliveryAddress: order.delivery_address,
    delivery_address: order.delivery_address,
    contactPhone: order.contact_phone,
    contact_phone: order.contact_phone,
    notes: order.notes,
    createdAt: order.created_at,
    created_at: order.created_at,
    items: items.map(formatOrderItem)
});

const ensureSystemSettingsTable = async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await dbRun("INSERT INTO system_settings (key, value) VALUES ('auto_deduct_stock', 'false') ON CONFLICT (key) DO NOTHING");
};

const getSystemSettings = async () => {
    await ensureSystemSettingsTable();
    const rows = await dbAll('SELECT key, value FROM system_settings');
    return rows.reduce((settings, row) => {
        settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
        return settings;
    }, { auto_deduct_stock: false });
};

// --- HEALTH ---
app.get('/health', (req, res) => res.json({ status: 'ok', path: 'root-health', db: !!DATABASE_URL }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', path: 'api-health', db: !!DATABASE_URL }));

// ===================== AUTH =====================
app.post('/api/auth/login', rateLimit({ keyPrefix: 'login', limit: 10, windowMs: 15 * 60 * 1000 }), async (req, res) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) return res.status(400).json({ error: 'Р›РѕРіРёРЅ Рё РїР°СЂРѕР»СЊ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹' });

        const user = await dbGet('SELECT * FROM users WHERE email = ?', [login.toLowerCase()]);
        if (!user) return res.status(401).json({ error: 'РќРµРІРµСЂРЅС‹Р№ Р»РѕРіРёРЅ РёР»Рё РїР°СЂРѕР»СЊ' });
        if (user.is_active !== 1) return res.status(403).json({ error: 'РђРєРєР°СѓРЅС‚ РґРµР°РєС‚РёРІРёСЂРѕРІР°РЅ' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'РќРµРІРµСЂРЅС‹Р№ Р»РѕРіРёРЅ РёР»Рё РїР°СЂРѕР»СЊ' });

        await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        await logAction(user.id, 'login', user.id, `Р’С…РѕРґ: ${user.email}`, req.ip);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, normalizedRole: normalizeRole(user.role), company: user.company_name },
            JWT_SECRET, { expiresIn: '24h' }
        );

        res.json({
            success: true, token,
            user: sanitizeUser(user)
        });
    } catch (e) { console.error('Login error:', e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// OTP Login
app.post('/api/auth/login-otp', rateLimit({ keyPrefix: 'otp', limit: 8, windowMs: 15 * 60 * 1000 }), async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'РљРѕРґ РѕР±СЏР·Р°С‚РµР»РµРЅ' });

        const otp = await dbGet('SELECT * FROM otp_codes WHERE code = ? AND used = false AND expires_at > CURRENT_TIMESTAMP', [code]);
        if (!otp) return res.status(401).json({ error: 'РќРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅС‹Р№ РёР»Рё РїСЂРѕСЃСЂРѕС‡РµРЅРЅС‹Р№ РѕРґРЅРѕСЂР°Р·РѕРІС‹Р№ РєРѕРґ' });

        const user = await dbGet('SELECT * FROM users WHERE id = ?', [otp.user_id]);
        if (!user || user.is_active !== 1) return res.status(401).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РґРµР°РєС‚РёРІРёСЂРѕРІР°РЅ' });

        // Mark OTP as used
        await dbRun('UPDATE otp_codes SET used = true, used_at = CURRENT_TIMESTAMP WHERE id = ?', [otp.id]);

        // Force password change
        await dbRun('UPDATE users SET must_change_password = true WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, normalizedRole: normalizeRole(user.role), company: user.company_name },
            JWT_SECRET, { expiresIn: '24h' }
        );
        await logAction(user.id, 'otp_login', user.id, `Р’С…РѕРґ РїРѕ OTP: ${user.email}`, req.ip);

        res.json({
            success: true, token,
            user: sanitizeUser({ ...user, must_change_password: true }),
            must_change_password: true
        });
    } catch (e) { console.error('OTP Login error:', e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// Force password change
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { new_password } = req.body;
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: 'РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ СЃРѕРґРµСЂР¶Р°С‚СЊ РјРёРЅРёРјСѓРј 6 СЃРёРјРІРѕР»РѕРІ' });
        }
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ' });

        const hash = await bcrypt.hash(new_password, 12);
        await dbRun('UPDATE users SET password = ?, must_change_password = false WHERE id = ?', [hash, req.user.id]);
        const updatedUser = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
        await logAction(req.user.id, 'password_changed', req.user.id, 'РЎРјРµРЅР° РїР°СЂРѕР»СЏ', req.ip);

        res.json({ success: true, message: 'РџР°СЂРѕР»СЊ СѓСЃРїРµС€РЅРѕ РёР·РјРµРЅС‘РЅ', user: sanitizeUser(updatedUser) });
    } catch (e) { console.error('Change password error:', e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.post('/api/auth/verify', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (!user || user.is_active !== 1) return res.status(401).json({ valid: false });
        res.json({ valid: true, user: sanitizeUser(user) });
    } catch (e) { res.status(401).json({ valid: false }); }
});

// Register request
app.post('/api/auth/register-request', rateLimit({ keyPrefix: 'register', limit: 6, windowMs: 60 * 60 * 1000 }), async (req, res) => {
    try {
        const { company_name, contact_person, phone, email, message } = req.body;
        if (!company_name || !contact_person || !phone || !email) {
            return res.status(400).json({ error: 'Р—Р°РїРѕР»РЅРёС‚Рµ РєРѕРјРїР°РЅРёСЋ, РєРѕРЅС‚Р°РєС‚РЅРѕРµ Р»РёС†Рѕ, С‚РµР»РµС„РѕРЅ Рё email' });
        }

        let user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (user?.is_active === 1) {
            return res.status(409).json({ error: 'РђРєРєР°СѓРЅС‚ СЃ СЌС‚РёРј email СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚. Р’РѕР№РґРёС‚Рµ С‡РµСЂРµР· Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚ РёР»Рё Р·Р°РїСЂРѕСЃРёС‚Рµ OTP Сѓ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.' });
        }
        if (!user) {
            const hash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
            const result = await q("INSERT INTO users (email, password, role, company_name, contact_person, phone, address, is_active, must_change_password) VALUES ($1, $2, 'client', $3, $4, $5, '', 0, true) RETURNING *",
                [email.toLowerCase(), hash, company_name, contact_person, phone]);
            user = result.rows[0];
        }

        let conv = await dbGet("SELECT * FROM chat_conversations WHERE user_id = ? AND status != 'closed'", [user.id]);
        if (!conv) {
            const guestToken = crypto.randomBytes(24).toString('hex');
            const convResult = await q("INSERT INTO chat_conversations (user_id, status, guest_token) VALUES ($1, 'operator', $2) RETURNING id, status, user_id, guest_token, created_at, updated_at", [user.id, guestToken]);
            conv = convResult.rows[0];
        } else {
            if (!conv.guest_token) {
                const guestToken = crypto.randomBytes(24).toString('hex');
                const tokenResult = await q("UPDATE chat_conversations SET guest_token = $1 WHERE id = $2 RETURNING *", [guestToken, conv.id]);
                conv = tokenResult.rows[0];
            }
            await dbRun("UPDATE chat_conversations SET status = 'operator', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conv.id]);
        }

        const requestMessage = [
            `Р—Р°СЏРІРєР° РЅР° СЂРµРіРёСЃС‚СЂР°С†РёСЋ: ${company_name}`,
            `РљРѕРЅС‚Р°РєС‚: ${contact_person}`,
            `РўРµР»РµС„РѕРЅ: ${phone}`,
            `Email: ${email}`,
            message ? `РЎРѕРѕР±С‰РµРЅРёРµ: ${message}` : ''
        ].filter(Boolean).join('\n');

        await dbRun("INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message) VALUES (?, 'user', ?, ?)",
            [conv.id, user.id, requestMessage]);
        await logAction(0, 'register_request', user.id, `Р—Р°СЏРІРєР°: ${company_name}, ${contact_person}, ${phone}, ${email}`, req.ip);
        const messages = await dbAll("SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC", [conv.id]);
        res.json({
            success: true,
            message: 'Р’Р°С€Р° Р·Р°СЏРІРєР° РїСЂРёРЅСЏС‚Р°! РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ СѓРІРёРґРёС‚ РµРµ РІ С‡Р°С‚Р°С… Рё СЃРІСЏР¶РµС‚СЃСЏ СЃ РІР°РјРё.',
            conversationId: conv.id,
            registrationToken: conv.guest_token,
            messages: messages.map(formatChatMessage)
        });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.get('/api/register-chat/:token/messages', async (req, res) => {
    try {
        const conv = await dbGet("SELECT * FROM chat_conversations WHERE guest_token = ? AND status != 'closed'", [req.params.token]);
        if (!conv) return res.status(404).json({ error: 'Р”РёР°Р»РѕРі РЅРµ РЅР°Р№РґРµРЅ' });
        const messages = await dbAll("SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC", [conv.id]);
        res.json({ success: true, conversation: conv, messages: messages.map(formatChatMessage) });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.post('/api/register-chat/:token/send', rateLimit({ keyPrefix: 'register-chat', limit: 30, windowMs: 15 * 60 * 1000 }), async (req, res) => {
    try {
        const message = String(req.body?.message || '').trim();
        if (!message) return res.status(400).json({ error: 'РЎРѕРѕР±С‰РµРЅРёРµ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ РїСѓСЃС‚С‹Рј' });
        if (message.length > 2000) return res.status(400).json({ error: 'РЎРѕРѕР±С‰РµРЅРёРµ СЃР»РёС€РєРѕРј РґР»РёРЅРЅРѕРµ' });

        const conv = await dbGet("SELECT * FROM chat_conversations WHERE guest_token = ? AND status != 'closed'", [req.params.token]);
        if (!conv) return res.status(404).json({ error: 'Р”РёР°Р»РѕРі РЅРµ РЅР°Р№РґРµРЅ' });

        const result = await q("INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message) VALUES ($1, 'user', $2, $3) RETURNING *",
            [conv.id, conv.user_id, message]);
        await dbRun("UPDATE chat_conversations SET status = 'operator', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conv.id]);

        res.json({ success: true, message: formatChatMessage(result.rows[0]) });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// ===================== ADMIN =====================
app.post('/api/admin/:secret/login', rateLimit({ keyPrefix: 'admin-login', limit: 8, windowMs: 15 * 60 * 1000 }), async (req, res) => {
    try {
        if (req.params.secret !== ADMIN_SECRET_URL) return res.status(404).json({ error: 'Endpoint РЅРµ РЅР°Р№РґРµРЅ' });
        const { login, password, adminKey } = req.body;
        if (!login || !password) return res.status(400).json({ error: 'Р›РѕРіРёРЅ Рё РїР°СЂРѕР»СЊ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹' });
        if (!adminKey || adminKey !== ADMIN_SECRET_KEY) return res.status(401).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });

        const user = await dbGet("SELECT * FROM users WHERE email = ? AND role IN ('admin', 'developer', 'manager', 'hr', 'support', 'operator', 'ai')", [login.toLowerCase()]);
        if (!user) return res.status(401).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });

        await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        await logAction(user.id, 'admin_login', user.id, `Р’С…РѕРґ Р°РґРјРёРЅР°: ${user.email}`, req.ip);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, normalizedRole: normalizeRole(user.role), isAdmin: true },
            JWT_SECRET, { expiresIn: '8h' }
        );

        res.json({ success: true, token, user: sanitizeUser(user) });
    } catch (e) { console.error('Admin login error:', e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// Admin stats
app.get('/api/admin/stats', authenticateToken, requireBackoffice, async (req, res) => {
    try {
        const totalPartners = await dbGet("SELECT COUNT(*) as count FROM users WHERE role IN ('partner', 'client')");
        const activePartners = await dbGet("SELECT COUNT(*) as count FROM users WHERE role IN ('partner', 'client') AND is_active = 1");
        const totalOrders = await dbGet('SELECT COUNT(*) as count FROM orders');
        const pendingOrders = await dbGet("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
        const totalProducts = await dbGet('SELECT COUNT(*) as count FROM products');
        const activeChats = await dbGet("SELECT COUNT(*) as count FROM chat_conversations WHERE status != 'closed'");
        const pendingOtp = await dbGet("SELECT COUNT(*) as count FROM otp_codes WHERE used = false AND expires_at > CURRENT_TIMESTAMP");

        res.json({
            stats: {
                totalPartners: totalPartners?.count || 0,
                activePartners: activePartners?.count || 0,
                inactivePartners: (totalPartners?.count || 0) - (activePartners?.count || 0),
                totalOrders: totalOrders?.count || 0,
                pendingOrders: pendingOrders?.count || 0,
                totalProducts: totalProducts?.count || 0,
                activeChats: activeChats?.count || 0,
                pendingOtp: pendingOtp?.count || 0
            }
        });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// Admin users CRUD
app.get('/api/admin/users', authenticateToken, requireUserAdmin, async (req, res) => {
    try {
        const isDeveloper = roleMatches(req.user.role, ['developer']);
        const users = isDeveloper
            ? await dbAll("SELECT * FROM users WHERE role IN ('developer','admin','support','operator','ai','partner','client','manager','hr') ORDER BY created_at DESC")
            : await dbAll("SELECT * FROM users WHERE role IN ('admin','support','operator','partner','client','manager','hr') ORDER BY created_at DESC");
        res.json(users.map(sanitizeUser));
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.post('/api/admin/users', authenticateToken, requireUserAdmin, async (req, res) => {
    try {
        const { email, role = 'client', companyName, contactPerson, phone, address } = req.body;
        if (!email || !companyName) return res.status(400).json({ error: 'Email Рё РЅР°Р·РІР°РЅРёРµ РєРѕРјРїР°РЅРёРё РѕР±СЏР·Р°С‚РµР»СЊРЅС‹' });
        const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing) return res.status(400).json({ error: 'Р­С‚РѕС‚ email СѓР¶Рµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ' });
        const allowedRoles = ['client', 'operator', 'support', 'admin', 'developer', 'ai', 'manager', 'hr', 'partner'];
        const safeRole = allowedRoles.includes(role) ? role : 'client';
        if (!roleMatches(req.user.role, ['developer']) && ['developer', 'ai'].includes(safeRole)) {
            return res.status(403).json({ error: 'РўРѕР»СЊРєРѕ СЂР°Р·СЂР°Р±РѕС‚С‡РёРє РјРѕР¶РµС‚ СЃРѕР·РґР°РІР°С‚СЊ СЌС‚Сѓ СЂРѕР»СЊ' });
        }
        const hash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
        
        const result = await q("INSERT INTO users (email, password, role, company_name, contact_person, phone, address, is_active, created_by, must_change_password) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, true) RETURNING *",
            [email.toLowerCase(), hash, safeRole, companyName, contactPerson || '', phone || '', address || '', req.user.id]);
        
        const user = result.rows[0];
        const otp = await createOtpForUser(user.id, req.user.id);
        await logAction(req.user.id, 'create_user', user.id, `РЎРѕР·РґР°РЅ: ${email} (${safeRole}), РІС‹РґР°РЅ РѕРґРЅРѕСЂР°Р·РѕРІС‹Р№ РєРѕРґ`, req.ip);
        res.json({
            success: true,
            user: sanitizeUser(user),
            otp: { code: otp.code, expires_at: otp.expires_at.toISOString(), user_email: user.email }
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.put('/api/admin/users/:id', authenticateToken, requireUserAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, contactPerson, phone, address, isActive, role, newPassword } = req.body;
        const updates = []; const params = [];
        const targetUser = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
        if (!targetUser) return res.status(404).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ' });
        if (!roleMatches(req.user.role, ['developer']) && ['developer', 'ai'].includes(normalizeRole(targetUser.role))) {
            return res.status(403).json({ error: 'РўРѕР»СЊРєРѕ СЂР°Р·СЂР°Р±РѕС‚С‡РёРє РјРѕР¶РµС‚ РјРµРЅСЏС‚СЊ СЌС‚Сѓ СѓС‡РµС‚РЅСѓСЋ Р·Р°РїРёСЃСЊ' });
        }
        if (newPassword && !roleMatches(req.user.role, ['developer'])) {
            return res.status(403).json({ error: 'РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ РЅРµ РјРѕР¶РµС‚ Р·Р°РґР°РІР°С‚СЊ РїРѕСЃС‚РѕСЏРЅРЅС‹Р№ РїР°СЂРѕР»СЊ. Р’С‹РґР°Р№С‚Рµ РѕРґРЅРѕСЂР°Р·РѕРІС‹Р№ РєРѕРґ.' });
        }
        if (role && !['client', 'operator', 'support', 'admin', 'developer', 'ai', 'manager', 'hr', 'partner'].includes(role)) {
            return res.status(400).json({ error: 'РќРµРґРѕРїСѓСЃС‚РёРјР°СЏ СЂРѕР»СЊ' });
        }
        if (role && !roleMatches(req.user.role, ['developer']) && ['developer', 'ai'].includes(normalizeRole(role))) {
            return res.status(403).json({ error: 'РўРѕР»СЊРєРѕ СЂР°Р·СЂР°Р±РѕС‚С‡РёРє РјРѕР¶РµС‚ РЅР°Р·РЅР°С‡Р°С‚СЊ СЌС‚Сѓ СЂРѕР»СЊ' });
        }
        if (companyName !== undefined) { updates.push('company_name = ?'); params.push(companyName); }
        if (contactPerson !== undefined) { updates.push('contact_person = ?'); params.push(contactPerson); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address); }
        if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
        if (role !== undefined) { updates.push('role = ?'); params.push(role); }
        if (newPassword) { updates.push('password = ?'); params.push(await bcrypt.hash(newPassword, 12)); }
        if (updates.length === 0) return res.status(400).json({ error: 'РќРµС‚ РґР°РЅРЅС‹С…' });

        let i = 1;
        const pgUpdates = updates.map(u => u.replace('?', `$${i++}`));
        params.push(id);
        
        const result = await pool.query(`UPDATE users SET ${pgUpdates.join(', ')} WHERE id = $${i} RETURNING *`, params);
        const user = result.rows[0];
        await logAction(req.user.id, 'update_user', id, `РћР±РЅРѕРІР»С‘РЅ: ${user.email}`, req.ip);
        res.json({ user: sanitizeUser(user) });
    } catch (e) { console.error(e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.delete('/api/admin/users/:id', authenticateToken, requireUserAdmin, async (req, res) => {
    try {
        const targetUser = await dbGet('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (!targetUser) return res.status(404).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ' });
        if (!roleMatches(req.user.role, ['developer']) && ['developer', 'ai'].includes(normalizeRole(targetUser.role))) {
            return res.status(403).json({ error: 'РўРѕР»СЊРєРѕ СЂР°Р·СЂР°Р±РѕС‚С‡РёРє РјРѕР¶РµС‚ РѕС‚РєР»СЋС‡Р°С‚СЊ СЌС‚Сѓ СѓС‡РµС‚РЅСѓСЋ Р·Р°РїРёСЃСЊ' });
        }
        const result = await q('UPDATE users SET is_active = 0 WHERE id = $1 RETURNING *', [req.params.id]);
        const user = result.rows[0];
        await logAction(req.user.id, 'deactivate_user', req.params.id, `Р”РµР°РєС‚РёРІРёСЂРѕРІР°РЅ: ${user?.email}`, req.ip);
        res.json({ success: true, message: 'Р”РµР°РєС‚РёРІРёСЂРѕРІР°РЅ' });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// Admin OTP Generator
app.post('/api/admin/generate-otp', authenticateToken, requireUserAdmin, async (req, res) => {
    try {
        const { user_id } = req.body;
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [user_id]);
        if (!user) return res.status(404).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ' });
        if (!roleMatches(req.user.role, ['developer']) && ['developer', 'ai'].includes(normalizeRole(user.role))) {
            return res.status(403).json({ error: 'РўРѕР»СЊРєРѕ СЂР°Р·СЂР°Р±РѕС‚С‡РёРє РјРѕР¶РµС‚ РІС‹РґР°РІР°С‚СЊ РґРѕСЃС‚СѓРї СЌС‚РѕР№ СЂРѕР»Рё' });
        }

        const otp = await createOtpForUser(user_id, req.user.id);
        await logAction(req.user.id, 'generate_otp', user_id, `Р’С‹РґР°РЅ РѕРґРЅРѕСЂР°Р·РѕРІС‹Р№ РєРѕРґ РґР»СЏ ${user.email}`, req.ip);

        res.json({ code: otp.code, expires_at: otp.expires_at.toISOString(), user_email: user.email });
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// Admin products
app.get('/api/admin/products', authenticateToken, requireCatalogManager, async (req, res) => {
    try {
        const products = await dbAll('SELECT * FROM products ORDER BY name ASC');
        res.json(products);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.post('/api/admin/products', authenticateToken, requireCatalogManager, async (req, res) => {
    try {
        const { name, price, stock, manufacturer, category, description, discount, discount_label } = req.body;
        const result = await q('INSERT INTO products (guid, name, price, stock, manufacturer, category, description, is_active, discount, discount_label) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9) RETURNING *',
            ['prod-' + Date.now(), name, price, stock, manufacturer, category, description || '', discount || 0, discount_label || null]);
        await logAction(req.user.id, 'create_product', null, `РўРѕРІР°СЂ: ${name}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/products/:id', authenticateToken, requireCatalogManager, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock, manufacturer, category, description, discount, discount_label } = req.body;
        const is_active = req.body.is_active !== undefined ? req.body.is_active : req.body.isActive;
        
        const updates = []; const params = [];
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (price !== undefined) { updates.push('price = ?'); params.push(price); }
        if (stock !== undefined) { updates.push('stock = ?'); params.push(stock); }
        if (manufacturer !== undefined) { updates.push('manufacturer = ?'); params.push(manufacturer); }
        if (category !== undefined) { updates.push('category = ?'); params.push(category); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
        if (discount !== undefined) { updates.push('discount = ?'); params.push(discount); }
        if (discount_label !== undefined) { updates.push('discount_label = ?'); params.push(discount_label); }

        if (updates.length === 0) return res.status(400).json({ error: 'РќРµС‚ РґР°РЅРЅС‹С…' });

        let i = 1;
        const pgUpdates = updates.map(u => u.replace('?', `$${i++}`));
        params.push(id);
        
        const result = await pool.query(`UPDATE products SET ${pgUpdates.join(', ')} WHERE id = $${i} RETURNING *`, params);
        await logAction(req.user.id, 'update_product', null, `РўРѕРІР°СЂ РѕР±РЅРѕРІР»С‘РЅ: ${result.rows[0]?.name}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/orders', authenticateToken, requireOrderManager, async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT o.*, u.email, u.company_name, u.contact_person, u.phone AS user_phone
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC
        `);
        const orders = [];
        for (const order of rows) {
            const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            orders.push({
                ...formatOrder(order, items),
                user: {
                    email: order.email,
                    companyName: order.company_name,
                    contactPerson: order.contact_person,
                    phone: order.user_phone
                }
            });
        }
        res.json({ success: true, orders });
    } catch (e) { console.error(e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.put('/api/admin/orders/:id/status', authenticateToken, requireOrderManager, async (req, res) => {
    try {
        const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        const status = req.body.status;
        if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°РєР°Р·Р°' });

        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false');
        const previousOrder = await dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!previousOrder) return res.status(404).json({ error: 'Р—Р°РєР°Р· РЅРµ РЅР°Р№РґРµРЅ' });

        if (status === 'processing') {
            const settings = await getSystemSettings();
            if (settings.auto_deduct_stock && !previousOrder.stock_deducted) {
                const items = await dbAll('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
                for (const item of items) {
                    await dbRun('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [Number(item.quantity || 0), item.product_id]);
                }
                await dbRun('UPDATE orders SET stock_deducted = true WHERE id = ?', [req.params.id]);
            }
        }

        const result = await q('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [status, req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Р—Р°РєР°Р· РЅРµ РЅР°Р№РґРµРЅ' });

        await logAction(req.user.id, 'update_order_status', result.rows[0].user_id, `Р—Р°РєР°Р· ${result.rows[0].order_number}: ${status}`, req.ip);
        res.json({ success: true, order: formatOrder(result.rows[0]) });
    } catch (e) { console.error(e); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// ===================== PRODUCTS =====================
app.get('/api/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        let sql = 'SELECT * FROM products WHERE is_active = 1';
        const params = [];
        if (category) { sql += ' AND category = ?'; params.push(category); }
        if (search) { sql += ' AND (name ILIKE ? OR manufacturer ILIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        sql += ' ORDER BY name';
        const products = await dbAll(sql, params);
        res.json(products);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/products/category/:category', async (req, res) => {
    try {
        const products = await dbAll('SELECT * FROM products WHERE category = ? AND is_active = 1 ORDER BY name', [req.params.category]);
        res.json(products);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await dbGet('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
        if (!product) return res.status(404).json({ error: 'РўРѕРІР°СЂ РЅРµ РЅР°Р№РґРµРЅ' });
        res.json(product);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== USERS =====================
app.get('/api/users/me', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'РќРµ РЅР°Р№РґРµРЅ' });
        res.json(sanitizeUser(user));
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.put('/api/users/me', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const { contact_person, phone, address, company_name } = req.body;
        await dbRun('UPDATE users SET contact_person = COALESCE(?, contact_person), phone = COALESCE(?, phone), address = COALESCE(?, address), company_name = COALESCE(?, company_name) WHERE id = ?',
            [contact_person, phone, address, company_name, req.user.id]);
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
        res.json(sanitizeUser(user));
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== ORDERS =====================
app.get('/api/orders', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const orders = await dbAll('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        const ordersWithItems = [];
        for (const o of orders) {
            const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
            ordersWithItems.push(formatOrder(o, items));
        }
        res.json({ success: true, orders: ordersWithItems });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/orders/:id', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const order = await dbGet('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (!order) return res.status(404).json({ error: 'Р—Р°РєР°Р· РЅРµ РЅР°Р№РґРµРЅ' });
        const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        res.json({ success: true, order: formatOrder(order, items) });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.post('/api/orders', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const cartItems = await dbAll('SELECT * FROM cart_items WHERE user_id = ?', [req.user.id]);
        if (!cartItems || cartItems.length === 0) return res.status(400).json({ error: 'РљРѕСЂР·РёРЅР° РїСѓСЃС‚Р°' });
        const total = cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
        const deliveryAddress = req.body.delivery_address || req.body.deliveryAddress || '';
        const contactPhone = req.body.contact_phone || req.body.contactPhone || '';
        const notes = req.body.notes || '';

        const result = await q("INSERT INTO orders (user_id, order_number, status, total_amount, items_count, delivery_address, contact_phone, notes) VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7) RETURNING id, order_number, status, total_amount, items_count, delivery_address, contact_phone, notes, created_at",
            [req.user.id, orderNumber, total, cartItems.length, deliveryAddress, contactPhone, notes]);
        const order = result.rows[0];

        for (const item of cartItems) {
            await q('INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total) VALUES ($1, $2, $3, $4, $5, $6)',
                [order.id, item.product_id, item.product_name, item.quantity, item.price, item.price * item.quantity]);
        }
        await dbRun('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
        let conv = await dbGet("SELECT * FROM chat_conversations WHERE user_id = ? AND status != 'closed'", [req.user.id]);
        if (!conv) {
            const convResult = await q("INSERT INTO chat_conversations (user_id, status) VALUES ($1, 'operator') RETURNING id, status, user_id, created_at, updated_at", [req.user.id]);
            conv = convResult.rows[0];
        } else {
            await dbRun("UPDATE chat_conversations SET status = 'operator', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conv.id]);
        }
        const orderMessage = `РќРѕРІС‹Р№ Р·Р°РєР°Р· ${order.order_number}: ${cartItems.length} РїРѕР·РёС†РёР№, СЃСѓРјРјР° ${Number(total).toLocaleString('ru-RU')} UZS. РўРµР»РµС„РѕРЅ: ${contactPhone || 'РЅРµ СѓРєР°Р·Р°РЅ'}. РђРґСЂРµСЃ: ${deliveryAddress || 'РЅРµ СѓРєР°Р·Р°РЅ'}.`;
        await dbRun("INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message) VALUES (?, 'system', ?, ?)",
            [conv.id, req.user.id, orderMessage]);
        await logAction(req.user.id, 'create_order', req.user.id, `Р—Р°РєР°Р· ${order.order_number}: ${total} UZS`, req.ip);
        const orderItems = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        res.json({
            success: true,
            order: formatOrder(order, orderItems),
            conversationId: conv.id
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.put('/api/orders/:id/cancel', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const order = await dbGet('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (!order) return res.status(404).json({ error: 'Р—Р°РєР°Р· РЅРµ РЅР°Р№РґРµРЅ' });
        if (order.status !== 'pending') return res.status(400).json({ error: 'РњРѕР¶РЅРѕ РѕС‚РјРµРЅРёС‚СЊ С‚РѕР»СЊРєРѕ РѕР¶РёРґР°СЋС‰РёР№ Р·Р°РєР°Р·' });
        
        const result = await q("UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *", [req.params.id]);
        await logAction(req.user.id, 'cancel_order', req.user.id, `РћС‚РјРµРЅС‘РЅ: ${order.order_number}`, req.ip);
        res.json({ success: true, order: formatOrder(result.rows[0]) });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== CART =====================
app.get('/api/cart', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const items = await dbAll(`
            SELECT c.*, COALESCE(p.stock, 0) AS stock
            FROM cart_items c
            LEFT JOIN products p ON p.id = c.product_id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [req.user.id]);
        res.json(formatCartResponse(items));
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.post('/api/cart', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const product_id = req.body.product_id || req.body.productId;
        const quantity = Math.max(1, Number(req.body.quantity || 1));
        if (!product_id) return res.status(400).json({ error: 'РўРѕРІР°СЂ РѕР±СЏР·Р°С‚РµР»РµРЅ' });
        const product = await dbGet('SELECT * FROM products WHERE id = ? AND is_active = 1', [product_id]);
        if (!product) return res.status(404).json({ error: 'РўРѕРІР°СЂ РЅРµ РЅР°Р№РґРµРЅ' });

        const existing = await dbGet('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
        if (existing) {
            const updated = await q('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *', [quantity, existing.id]);
            return res.json({ success: true, item: formatCartItem(updated.rows[0]) });
        }

        const result = await q('INSERT INTO cart_items (user_id, product_id, product_name, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, product_id, product.name, quantity, product.price]);
        res.json({ success: true, item: formatCartItem(result.rows[0]) });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.put('/api/cart/:id', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const quantity = Math.max(1, Number(req.body.quantity || 1));
        const result = await q('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [quantity, req.params.id, req.user.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'РџРѕР·РёС†РёСЏ РєРѕСЂР·РёРЅС‹ РЅРµ РЅР°Р№РґРµРЅР°' });
        res.json({ success: true, item: formatCartItem(result.rows[0]) });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.delete('/api/cart/:id', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        await dbRun('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'РЈРґР°Р»РµРЅРѕ' });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.delete('/api/cart', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        await dbRun('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
        res.json({ success: true, message: 'РљРѕСЂР·РёРЅР° РѕС‡РёС‰РµРЅР°' });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== CABINET DATA =====================
app.get('/api/cabinet/debts', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const debt = await dbGet('SELECT * FROM debts WHERE user_id = ?', [req.user.id]);
        res.json(debt || { amount: 0, credit_limit: 0, overdue_amount: 0, currency: 'UZS' });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/cabinet/documents', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const docs = await dbAll('SELECT * FROM documents WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
        res.json(docs);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/cabinet/claims', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const claims = await dbAll('SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(claims);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.post('/api/cabinet/claims', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const result = await q("INSERT INTO claims (user_id, order_id, product_id, type, description, status) VALUES ($1, $2, $3, $4, $5, 'open') RETURNING *",
            [req.user.id, req.body.order_id || null, req.body.product_id || null, req.body.type, req.body.description]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/cabinet/certificates', authenticateToken, requireActiveAccount, async (req, res) => {
    try {
        const certs = await dbAll('SELECT * FROM certificates ORDER BY created_at DESC');
        res.json(certs);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== CHAT SYSTEM =====================
app.post('/api/chat/start', authenticateToken, async (req, res) => {
    try {
        let conv = await dbGet("SELECT * FROM chat_conversations WHERE user_id = ? AND status != 'closed'", [req.user.id]);
        if (!conv) {
            const resInsert = await q("INSERT INTO chat_conversations (user_id, status) VALUES ($1, 'ai') RETURNING id, status, user_id, created_at, updated_at", [req.user.id]);
            conv = resInsert.rows[0];
            
            // Seed initial AI message
            await dbRun("INSERT INTO chat_messages (conversation_id, sender_type, message) VALUES (?, 'ai', ?)",
                [conv.id, 'Р—РґСЂР°РІСЃС‚РІСѓР№С‚Рµ! РЇ РІРёСЂС‚СѓР°Р»СЊРЅС‹Р№ РїРѕРјРѕС‰РЅРёРє Curatio Pharm. Р—Р°РґР°Р№С‚Рµ РјРЅРµ РІРѕРїСЂРѕСЃ, Рё СЏ РїРѕСЃС‚Р°СЂР°СЋСЃСЊ РїРѕРјРѕС‡СЊ. Р•СЃР»Рё РїРѕС‚СЂРµР±СѓРµС‚СЃСЏ, РІС‹ РІСЃРµРіРґР° РјРѕР¶РµС‚Рµ СЃРІСЏР·Р°С‚СЊСЃСЏ СЃ РѕРїРµСЂР°С‚РѕСЂРѕРј.']);
        }
        const messages = await dbAll("SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC", [conv.id]);
        res.json({ conversation: conv, messages: messages.map(formatChatMessage) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.get('/api/chat/messages/:conversationId', authenticateToken, async (req, res) => {
    try {
        const conv = await dbGet("SELECT * FROM chat_conversations WHERE id = ?", [req.params.conversationId]);
        if (!conv) return res.status(404).json({ error: 'Р§Р°С‚ РЅРµ РЅР°Р№РґРµРЅ' });
        if (conv.user_id !== req.user.id && !roleMatches(req.user.role, ['developer', 'admin', 'support', 'operator'])) {
            return res.status(403).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });
        }
        const messages = await dbAll("SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC", [conv.id]);
        res.json({ conversation: conv, messages: messages.map(formatChatMessage) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.post('/api/chat/send', authenticateToken, async (req, res) => {
    try {
        const conversation_id = req.body.conversation_id || req.body.conversationId;
        const message = String(req.body.message || '').trim();
        if (!message) return res.status(400).json({ error: 'РЎРѕРѕР±С‰РµРЅРёРµ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ РїСѓСЃС‚С‹Рј' });
        if (message.length > 2000) return res.status(400).json({ error: 'РЎРѕРѕР±С‰РµРЅРёРµ СЃР»РёС€РєРѕРј РґР»РёРЅРЅРѕРµ' });
        const conv = await dbGet("SELECT * FROM chat_conversations WHERE id = ?", [conversation_id]);
        if (!conv) return res.status(404).json({ error: 'Р§Р°С‚ РЅРµ РЅР°Р№РґРµРЅ' });
        if (conv.user_id !== req.user.id && !roleMatches(req.user.role, ['developer', 'admin', 'support', 'operator'])) {
            return res.status(403).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });
        }

        // Save user message
        const resUserMsg = await q("INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message) VALUES ($1, 'user', $2, $3) RETURNING *",
            [conversation_id, req.user.id, message]);
        const userMsg = resUserMsg.rows[0];
        await dbRun("UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conversation_id]);

        let aiResponse = null;
        if (conv.status === 'ai') {
            const lowerMsg = message.toLowerCase();
            const faq = [
                { keywords: ['РґРѕСЃС‚Р°РІРє', 'РґРѕСЃС‚Р°РІРёС‚', 'С‚СЂР°РЅСЃРїРѕСЂС‚'], answer: 'РњС‹ РѕСЃСѓС‰РµСЃС‚РІР»СЏРµРј РґРѕСЃС‚Р°РІРєСѓ РїРѕ РІСЃРµРјСѓ РЈР·Р±РµРєРёСЃС‚Р°РЅСѓ. Р”РѕСЃС‚Р°РІРєР° РІ СЂРµРіРёРѕРЅС‹ РѕР±С‹С‡РЅРѕ Р·Р°РЅРёРјР°РµС‚ РѕС‚ 24 РґРѕ 48 С‡Р°СЃРѕРІ.' },
                { keywords: ['Р°РґСЂРµСЃ', 'РіРґРµ', 'РЅР°С…РѕРґРёС‚', 'РѕС„РёСЃ', 'СЃРєР»Р°Рґ'], answer: 'РќР°С€ СЃРєР»Р°РґСЃРєРѕР№ РєРѕРјРїР»РµРєСЃ СЂР°СЃРїРѕР»РѕР¶РµРЅ РїРѕ Р°РґСЂРµСЃСѓ: Рі. РўР°С€РєРµРЅС‚, Р®РЅСѓСЃР°Р±Р°РґСЃРєРёР№ СЂ-РЅ, СѓР». РљР°СЂРёРјР° Р—Р°СЂРёРїРѕРІР°, 3.' },
                { keywords: ['РІСЂРµРјСЏ', 'С‡Р°СЃС‹', 'СЂР°Р±РѕС‚', 'СЂРµР¶РёРј'], answer: 'РњС‹ СЂР°Р±РѕС‚Р°РµРј СЃ РїРѕРЅРµРґРµР»СЊРЅРёРєР° РїРѕ РїСЏС‚РЅРёС†Сѓ СЃ 09:00 РґРѕ 18:00.' },
                { keywords: ['РєРѕРЅС‚Р°РєС‚', 'С‚РµР»РµС„РѕРЅ', 'СЃРІСЏР·', 'РЅРѕРјРµСЂ'], answer: 'Р’С‹ РјРѕР¶РµС‚Рµ СЃРІСЏР·Р°С‚СЊСЃСЏ СЃ РЅР°РјРё РїРѕ С‚РµР»РµС„РѕРЅСѓ +998 (71) 207-01-52 РёР»Рё РЅР°РїРёСЃР°С‚СЊ РЅР° info@cpharm.uz.' },
                { keywords: ['СЃРµСЂС‚РёС„РёРєР°С‚', 'РґРѕРєСѓРјРµРЅС‚', 'Р»РёС†РµРЅР·'], answer: 'Р’СЃРµ РЅР°С€Рё С‚РѕРІР°СЂС‹ СЃРµСЂС‚РёС„РёС†РёСЂРѕРІР°РЅС‹ РІ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРё СЃ С‚СЂРµР±РѕРІР°РЅРёСЏРјРё GDP Рё ISO 9001:2015. РЎРµСЂС‚РёС„РёРєР°С‚С‹ РґРѕСЃС‚СѓРїРЅС‹ РІ Р»РёС‡РЅРѕРј РєР°Р±РёРЅРµС‚Рµ.' }
            ];
            const faqMatch = faq.find(f => f.keywords.some(k => lowerMsg.includes(k)));
            const aiText = faqMatch ? faqMatch.answer : 'К сожалению, я не могу ответить на этот вопрос. Пожалуйста, нажмите «Связаться с оператором» для получения помощи от специалиста.';

            const resAiMsg = await q("INSERT INTO chat_messages (conversation_id, sender_type, message) VALUES ($1, 'ai', $2) RETURNING *",
                [conversation_id, aiText]);
            aiResponse = resAiMsg.rows[0];
        }

        res.json({ userMessage: formatChatMessage(userMsg), aiResponse: formatChatMessage(aiResponse) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.post('/api/chat/request-operator', authenticateToken, async (req, res) => {
    try {
        const conversation_id = req.body.conversation_id || req.body.conversationId;
        const conv = await dbGet("SELECT * FROM chat_conversations WHERE id = ?", [conversation_id]);
        if (!conv) return res.status(404).json({ error: 'Р§Р°С‚ РЅРµ РЅР°Р№РґРµРЅ' });
        if (conv.user_id !== req.user.id && !roleMatches(req.user.role, ['developer', 'admin', 'support', 'operator'])) {
            return res.status(403).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });
        }

        await dbRun("UPDATE chat_conversations SET status = 'operator', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conversation_id]);

        const sysText = 'рџ”” Р’С‹ Р±С‹Р»Рё РїРµСЂРµРєР»СЋС‡РµРЅС‹ РЅР° РѕРїРµСЂР°С‚РѕСЂР°. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РїРѕРґРѕР¶РґРёС‚Рµ вЂ” СЃРїРµС†РёР°Р»РёСЃС‚ СЃРєРѕСЂРѕ РѕС‚РІРµС‚РёС‚.';
        const resSysMsg = await q("INSERT INTO chat_messages (conversation_id, sender_type, message) VALUES ($1, 'ai', $2) RETURNING *",
            [conversation_id, sysText]);

        res.json({ conversation: { ...conv, status: 'operator' }, message: formatChatMessage(resSysMsg.rows[0]) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

// Admin chat endpoints
app.get('/api/admin/chats', authenticateToken, requireChatStaff, async (req, res) => {
    try {
        const convs = await dbAll("SELECT * FROM chat_conversations ORDER BY updated_at DESC");
        const fullConvs = [];
        for (const c of convs) {
            const user = await dbGet("SELECT * FROM users WHERE id = ?", [c.user_id]);
            const msgs = await dbAll("SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC", [c.id]);
            const lastMsg = msgs[msgs.length - 1];
            fullConvs.push({
                ...c,
                user: sanitizeUser(user),
                last_message: formatChatMessage(lastMsg),
                message_count: msgs.length
            });
        }
        res.json(fullConvs);
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.post('/api/admin/chats/:id/reply', authenticateToken, requireChatStaff, async (req, res) => {
    try {
        const conv = await dbGet("SELECT * FROM chat_conversations WHERE id = ?", [req.params.id]);
        if (!conv) return res.status(404).json({ error: 'Р§Р°С‚ РЅРµ РЅР°Р№РґРµРЅ' });
        const message = String(req.body.message || '').trim();
        if (!message) return res.status(400).json({ error: 'РЎРѕРѕР±С‰РµРЅРёРµ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ РїСѓСЃС‚С‹Рј' });
        if (message.length > 2000) return res.status(400).json({ error: 'РЎРѕРѕР±С‰РµРЅРёРµ СЃР»РёС€РєРѕРј РґР»РёРЅРЅРѕРµ' });

        const result = await q("INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message) VALUES ($1, 'operator', $2, $3) RETURNING *",
            [conv.id, req.user.id, message]);
        
        await dbRun("UPDATE chat_conversations SET status = 'operator', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conv.id]);
        res.json(formatChatMessage(result.rows[0]));
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.put('/api/admin/chats/:id/close', authenticateToken, requireChatStaff, async (req, res) => {
    try {
        const conv = await dbGet("SELECT * FROM chat_conversations WHERE id = ?", [req.params.id]);
        if (!conv) return res.status(404).json({ error: 'Р§Р°С‚ РЅРµ РЅР°Р№РґРµРЅ' });
        await dbRun("UPDATE chat_conversations SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conv.id]);
        res.json({ message: 'Р§Р°С‚ Р·Р°РєСЂС‹С‚' });
    } catch (err) { console.error(err); res.status(500).json({ error: 'РћС€РёР±РєР° СЃРµСЂРІРµСЂР°' }); }
});

app.get('/api/admin/settings', authenticateToken, requireOrderManager, async (req, res) => {
    try {
        res.json(await getSystemSettings());
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'РћС€РёР±РєР°' });
    }
});

app.put('/api/admin/settings', authenticateToken, requireOrderManager, async (req, res) => {
    try {
        await ensureSystemSettingsTable();
        if (req.body.auto_deduct_stock !== undefined) {
            await dbRun(
                "INSERT INTO system_settings (key, value, updated_at) VALUES ('auto_deduct_stock', ?, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP",
                [req.body.auto_deduct_stock ? 'true' : 'false']
            );
        }
        res.json(await getSystemSettings());
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'РћС€РёР±РєР°' });
    }
});

// Support settings
app.get('/api/admin/support-settings', authenticateToken, requireSupportManager, async (req, res) => {
    try {
        const settings = await dbGet('SELECT * FROM support_settings ORDER BY id DESC LIMIT 1');
        res.json(settings || { phone: '+998 (71) 207-01-52', email: 'info@cpharm.uz', work_hours: 'РџРЅ-РџС‚ 09:00-18:00' });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.put('/api/admin/support-settings', authenticateToken, requireSupportManager, async (req, res) => {
    try {
        const { phone, email, work_hours } = req.body;
        const existing = await dbGet('SELECT id FROM support_settings LIMIT 1');
        if (existing) {
            await dbRun('UPDATE support_settings SET phone = ?, email = ?, work_hours = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [phone, email, work_hours, req.user.id, existing.id]);
        } else {
            await dbRun('INSERT INTO support_settings (phone, email, work_hours, updated_by) VALUES (?, ?, ?, ?)',
                [phone, email, work_hours, req.user.id]);
        }
        const settings = await dbGet('SELECT * FROM support_settings LIMIT 1');
        res.json(settings);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/support-settings', async (req, res) => {
    try {
        const settings = await dbGet('SELECT * FROM support_settings LIMIT 1');
        res.json(settings || { phone: '+998 (71) 207-01-52', email: 'info@cpharm.uz', work_hours: 'РџРЅ-РџС‚ 09:00-18:00' });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== EVENTS SYSTEM =====================
app.get('/api/events/active', async (req, res) => {
    try {
        const active = await dbAll('SELECT * FROM events WHERE is_active = true AND starts_at <= CURRENT_TIMESTAMP AND ends_at >= CURRENT_TIMESTAMP');
        res.json(active);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/dev/events', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        const events = await dbAll('SELECT * FROM events ORDER BY created_at DESC');
        res.json(events);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.post('/api/dev/events', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        const { title, description, type, image_url, background_color, text_color, link_url, starts_at, ends_at } = req.body;
        const result = await q('INSERT INTO events (title, description, type, image_url, background_color, text_color, link_url, starts_at, ends_at, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [title, description || '', type || 'banner', image_url || '', background_color || '#10b981', text_color || '#ffffff', link_url || '', starts_at, ends_at, req.user.id]);
        const event = result.rows[0];
        await logAction(req.user.id, 'create_event', null, `РЎРѕР·РґР°РЅРѕ СЃРѕР±С‹С‚РёРµ: ${event.title}`, req.ip);
        res.json(event);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.put('/api/dev/events/:id', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, type, image_url, background_color, text_color, link_url, starts_at, ends_at, is_active } = req.body;
        
        const updates = []; const params = [];
        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (type !== undefined) { updates.push('type = ?'); params.push(type); }
        if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
        if (background_color !== undefined) { updates.push('background_color = ?'); params.push(background_color); }
        if (text_color !== undefined) { updates.push('text_color = ?'); params.push(text_color); }
        if (link_url !== undefined) { updates.push('link_url = ?'); params.push(link_url); }
        if (starts_at !== undefined) { updates.push('starts_at = ?'); params.push(starts_at); }
        if (ends_at !== undefined) { updates.push('ends_at = ?'); params.push(ends_at); }
        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

        if (updates.length === 0) return res.status(400).json({ error: 'РќРµС‚ РґР°РЅРЅС‹С…' });

        let i = 1;
        const pgUpdates = updates.map(u => u.replace('?', `$${i++}`));
        params.push(id);
        
        const result = await pool.query(`UPDATE events SET ${pgUpdates.join(', ')} WHERE id = $${i} RETURNING *`, params);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/dev/events/:id', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        await dbRun('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ message: 'РЎРѕР±С‹С‚РёРµ СѓРґР°Р»РµРЅРѕ' });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== DEVELOPER PANEL =====================
app.get('/api/dev/logs', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        const logs = await dbAll('SELECT * FROM admin_logs ORDER BY created_at DESC');
        const fullLogs = [];
        for (const log of logs) {
            const admin = await dbGet('SELECT contact_person, email FROM users WHERE id = ?', [log.admin_id]);
            const target = log.target_user_id ? await dbGet('SELECT contact_person, email FROM users WHERE id = ?', [log.target_user_id]) : null;
            fullLogs.push({
                id: log.id,
                admin_id: log.admin_id,
                action: log.action,
                target_user_id: log.target_user_id,
                details: String(log.details || '').replace(/OTP РґР»СЏ ([^:]+): [A-F0-9]+/gi, 'OTP РґР»СЏ $1: [СЃРєСЂС‹С‚Рѕ]'),
                ip_address: log.ip_address,
                created_at: log.created_at,
                admin_name: admin ? admin.contact_person || admin.email : 'System',
                target_name: target ? target.contact_person || target.email : null
            });
        }
        res.json(fullLogs);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/dev/stats', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        const usersCount = await dbGet("SELECT COUNT(*) as total, COUNT(CASE WHEN is_active=1 THEN 1 END) as active, COUNT(CASE WHEN role='client' OR role='partner' THEN 1 END) as clients, COUNT(CASE WHEN role IN ('admin','developer','support','operator','ai','manager','hr') THEN 1 END) as admins FROM users");
        const productsCount = await dbGet("SELECT COUNT(*) as total, COUNT(CASE WHEN is_active=1 THEN 1 END) as active FROM products");
        const ordersCount = await dbGet("SELECT COUNT(*) as total, COUNT(CASE WHEN status='pending' THEN 1 END) as pending, COUNT(CASE WHEN status='completed' THEN 1 END) as completed, COALESCE(SUM(total_amount), 0) as revenue FROM orders");
        const chatsCount = await dbGet("SELECT COUNT(*) as total, COUNT(CASE WHEN status!='closed' THEN 1 END) as active FROM chat_conversations");
        const eventsCount = await dbGet("SELECT COUNT(*) as total, COUNT(CASE WHEN is_active=true THEN 1 END) as active FROM events");
        const otpCount = await dbGet("SELECT COUNT(*) as total, COUNT(CASE WHEN used=false THEN 1 END) as unused FROM otp_codes");
        const logsCount = await dbGet("SELECT COUNT(*) as count FROM admin_logs");

        res.json({
            users: { total: parseInt(usersCount.total) || 0, active: parseInt(usersCount.active) || 0, clients: parseInt(usersCount.clients) || 0, admins: parseInt(usersCount.admins) || 0 },
            products: { total: parseInt(productsCount.total) || 0, active: parseInt(productsCount.active) || 0 },
            orders: { total: parseInt(ordersCount.total) || 0, pending: parseInt(ordersCount.pending) || 0, completed: parseInt(ordersCount.completed) || 0 },
            revenue: parseFloat(ordersCount.revenue) || 0,
            chats: { total: parseInt(chatsCount.total) || 0, active: parseInt(chatsCount.active) || 0 },
            events: { total: parseInt(eventsCount.total) || 0, active: parseInt(eventsCount.active) || 0 },
            otp: { total: parseInt(otpCount.total) || 0, unused: parseInt(otpCount.unused) || 0 },
            logs: parseInt(logsCount.count) || 0
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/dev/users-full', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        const users = await dbAll("SELECT * FROM users ORDER BY created_at DESC");
        const fullUsers = [];
        for (const u of users) {
            const count = await dbGet('SELECT COUNT(*) as c FROM orders WHERE user_id = ?', [u.id]);
            fullUsers.push({
                ...sanitizeUser(u),
                orders_count: parseInt(count?.c) || 0
            });
        }
        res.json(fullUsers);
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/dev/passwords', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        const users = await dbAll("SELECT id, email, role, company_name, contact_person, must_change_password, is_active FROM users ORDER BY created_at DESC");
        const rows = [];
        for (const user of users) {
            const otp = await dbGet("SELECT expires_at FROM otp_codes WHERE user_id = ? AND used = false AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1", [user.id]);
            rows.push({
                id: user.id,
                email: user.email,
                role: user.role,
                companyName: user.company_name,
                contactPerson: user.contact_person,
                isActive: user.is_active === 1,
                mustChangePassword: !!user.must_change_password,
                activeOtp: !!otp,
                otpExpiresAt: otp?.expires_at || null,
                passwordVisible: false
            });
        }
        res.json({ success: true, passwords: rows });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

app.get('/api/dev/system-info', authenticateToken, requireDeveloper, async (req, res) => {
    try {
        res.json({
            success: true,
            node: process.version,
            uptimeSeconds: Math.round(process.uptime()),
            memory: process.memoryUsage(),
            database: !!DATABASE_URL,
            environment: process.env.NODE_ENV || 'production'
        });
    } catch (e) { res.status(500).json({ error: 'РћС€РёР±РєР°' }); }
});

// ===================== INIT DB (developer/public) =====================
app.get('/api/init-db', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_INIT_DB) {
            return res.status(403).json({ error: 'Disabled in production' });
        }
        const providedToken = req.get('x-init-token') || req.query.token || '';
        if (!INIT_DB_TOKEN || providedToken !== INIT_DB_TOKEN) {
            return res.status(403).json({ error: 'Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ' });
        }

        // Create base tables
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('admin','manager','client','partner','developer','hr','support','operator','ai')),
            company_name TEXT, contact_person TEXT, phone TEXT, address TEXT,
            is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP, created_by INTEGER, must_change_password BOOLEAN DEFAULT false
        )`);
        
        // Ensure must_change_password exists (in case table was created previously without it)
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false`);
        await pool.query(`
            DO $$
            DECLARE role_constraint text;
            BEGIN
                SELECT conname INTO role_constraint
                FROM pg_constraint
                WHERE conrelid = 'users'::regclass
                  AND contype = 'c'
                  AND pg_get_constraintdef(oid) LIKE '%role%';

                IF role_constraint IS NOT NULL THEN
                    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', role_constraint);
                END IF;

                ALTER TABLE users ADD CONSTRAINT users_role_check
                CHECK(role IN ('admin','manager','client','partner','developer','hr','support','operator','ai'));
            END $$;
        `);

        await pool.query(`CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY, guid TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
            manufacturer TEXT, category TEXT, price DECIMAL(10,2) NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0, description TEXT, is_active INTEGER DEFAULT 1,
            discount INTEGER DEFAULT 0, discount_label TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, synced_at TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
            order_number TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'pending', total_amount DECIMAL(15,2) NOT NULL,
            items_count INTEGER NOT NULL, delivery_address TEXT, contact_phone TEXT, notes TEXT,
            stock_deducted BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false');
        await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL, total DECIMAL(15,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS cart_items (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1,
            price DECIMAL(10,2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id)
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS debts (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(15,2) NOT NULL DEFAULT 0, credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
            overdue_amount DECIMAL(15,2) NOT NULL DEFAULT 0, currency TEXT DEFAULT 'UZS',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            number TEXT NOT NULL, type TEXT NOT NULL, date DATE NOT NULL,
            amount DECIMAL(15,2) NOT NULL DEFAULT 0, status TEXT DEFAULT 'unpaid',
            file_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS claims (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            order_id INTEGER, product_id INTEGER, type TEXT NOT NULL,
            status TEXT DEFAULT 'new', description TEXT, admin_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS certificates (
            id SERIAL PRIMARY KEY, product_id INTEGER, name TEXT NOT NULL,
            file_url TEXT NOT NULL, expiration_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS login_attempts (
            id SERIAL PRIMARY KEY, ip_address TEXT NOT NULL, email TEXT,
            success INTEGER DEFAULT 0, attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS admin_logs (
            id SERIAL PRIMARY KEY, admin_id INTEGER NOT NULL, action TEXT NOT NULL,
            target_user_id INTEGER, details TEXT, ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create new feature tables
        await pool.query(`CREATE TABLE IF NOT EXISTS otp_codes (
            id SERIAL PRIMARY KEY, code VARCHAR(12) UNIQUE NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            used BOOLEAN DEFAULT false, used_at TIMESTAMP,
            expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS chat_conversations (
            id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'ai', guest_token TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )`);
        await pool.query(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS guest_token TEXT`);
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_guest_token_idx ON chat_conversations(guest_token) WHERE guest_token IS NOT NULL`);

        await pool.query(`CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY, conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
            sender_type VARCHAR(20) NOT NULL, sender_id INTEGER,
            message TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS support_settings (
            id SERIAL PRIMARY KEY, phone VARCHAR(50), email VARCHAR(100),
            work_hours VARCHAR(100), updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            updated_at TIMESTAMP DEFAULT NOW()
        )`);

        await ensureSystemSettingsTable();

        await pool.query(`CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT,
            type VARCHAR(30) DEFAULT 'banner', image_url TEXT,
            background_color VARCHAR(20), text_color VARCHAR(20), link_url TEXT,
            is_active BOOLEAN DEFAULT true, starts_at TIMESTAMP NOT NULL, ends_at TIMESTAMP NOT NULL,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMP DEFAULT NOW()
        )`);

        // Seed support_settings if empty
        const sc = await dbGet('SELECT count(*) as c FROM support_settings');
        if (parseInt(sc.c) === 0) {
            await dbRun('INSERT INTO support_settings (phone, email, work_hours) VALUES (?, ?, ?)',
                ['+998 (71) 207-01-52', 'info@cpharm.uz', 'РџРЅ-РџС‚ 09:00-18:00']);
        }

        const ensureTestAccount = async ({ email, oldEmails, password, role, companyName, contactPerson, phone, address }) => {
            const hash = await bcrypt.hash(password, 12);
            const target = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
            let source = target;

            if (!source) {
                for (const oldEmail of oldEmails) {
                    source = await dbGet('SELECT * FROM users WHERE email = ?', [oldEmail]);
                    if (source) break;
                }
            }

            if (source) {
                await dbRun(
                    'UPDATE users SET email = ?, password = ?, role = ?, company_name = ?, contact_person = ?, phone = ?, address = ?, is_active = 1, must_change_password = false WHERE id = ?',
                    [email, hash, role, companyName, contactPerson, phone, address, source.id]
                );
            } else {
                await dbRun(
                    'INSERT INTO users (email, password, role, company_name, contact_person, phone, address, is_active, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, 1, false)',
                    [email, hash, role, companyName, contactPerson, phone, address]
                );
            }

            for (const oldEmail of oldEmails) {
                if (oldEmail !== email) {
                    const oldUser = await dbGet('SELECT * FROM users WHERE email = ?', [oldEmail]);
                    if (oldUser) {
                        await dbRun('UPDATE users SET email = ?, is_active = 0 WHERE id = ?', [`${oldEmail}-disabled-${oldUser.id}`, oldUser.id]);
                    }
                }
            }
        };

        await ensureTestAccount({
            email: 'developer',
            oldEmails: ['develop-1', 'developer@cpharm.uz'],
            password: 'developer',
            role: 'developer',
            companyName: 'Curatio Pharm Dev',
            contactPerson: 'System Developer',
            phone: '+998000000000',
            address: 'Tashkent'
        });

        await ensureTestAccount({
            email: 'admin',
            oldEmails: ['admincp'],
            password: 'admin',
            role: 'admin',
            companyName: 'CuratioPharm',
            contactPerson: 'Administrator',
            phone: '+998712070152',
            address: 'Tashkent'
        });

        await ensureTestAccount({
            email: 'manager',
            oldEmails: ['manager@cpharm.uz'],
            password: 'manager',
            role: 'manager',
            companyName: 'Curatio Pharm',
            contactPerson: 'Manager',
            phone: '+998712070152',
            address: 'Tashkent'
        });

        const clientBeforeSeed = await dbGet("SELECT id FROM users WHERE email IN ('client', 'client1@apteka1.uz') LIMIT 1");
        await ensureTestAccount({
            email: 'client',
            oldEmails: ['client1@apteka1.uz'],
            password: 'client',
            role: 'client',
            companyName: 'Test Client',
            contactPerson: 'Client',
            phone: '+998901234567',
            address: 'Tashkent'
        });
        const clientAfterSeed = await dbGet("SELECT id FROM users WHERE email = 'client'");
        if (!clientBeforeSeed && clientAfterSeed) {
            await dbRun('INSERT INTO debts (user_id, amount, credit_limit, overdue_amount) VALUES (?, 4500000, 10000000, 0)', [clientAfterSeed.id]);
            await dbRun("INSERT INTO documents (user_id, number, type, date, amount, status) VALUES (?, 'INV-2024-001', 'Invoice', '2026-05-15', 1200000, 'Partially paid')", [clientAfterSeed.id]);
        }

        // Seed products
        const pc = await dbGet('SELECT count(*) as c FROM products');
        if (parseInt(pc.c) === 0) {
            const prods = [
                ['prod-001', 'РђРјРѕРєСЃРёС†РёР»Р»РёРЅ 500 РјРі', 'РЈР·С„Р°СЂРј', 'РђРЅС‚РёР±РёРѕС‚РёРєРё', 15000, 1200, 'РђРЅС‚РёР±РёРѕС‚РёРє С€РёСЂРѕРєРѕРіРѕ СЃРїРµРєС‚СЂР° РґРµР№СЃС‚РІРёСЏ'],
                ['prod-002', 'РђР·РёС‚СЂРѕРјРёС†РёРЅ 500 РјРі', 'РЈР·С„Р°СЂРј', 'РђРЅС‚РёР±РёРѕС‚РёРєРё', 25000, 800, 'РњР°РєСЂРѕР»РёРґРЅС‹Р№ Р°РЅС‚РёР±РёРѕС‚РёРє С€РёСЂРѕРєРѕРіРѕ СЃРїРµРєС‚СЂР° РґРµР№СЃС‚РІРёСЏ'],
                ['prod-003', 'Р¦РµС„С‚СЂРёР°РєСЃРѕРЅ 1.0 Рі', 'Р¤Р°СЂРјСЃС‚Р°РЅРґР°СЂС‚', 'РђРЅС‚РёР±РёРѕС‚РёРєРё', 18000, 1500, 'Р¦РµС„Р°Р»РѕСЃРїРѕСЂРёРЅРѕРІС‹Р№ Р°РЅС‚РёР±РёРѕС‚РёРє III РїРѕРєРѕР»РµРЅРёСЏ'],
                ['prod-006', 'Р’РёС‚Р°РјРёРЅ C 500 РјРі', 'Р’РёС‚Р°РјР°РєСЃ', 'Р’РёС‚Р°РјРёРЅС‹', 8000, 2000, 'РђСЃРєРѕСЂР±РёРЅРѕРІР°СЏ РєРёСЃР»РѕС‚Р°, СѓРєСЂРµРїР»РµРЅРёРµ РёРјРјСѓРЅРёС‚РµС‚Р°'],
                ['prod-007', 'РљРѕРјРїР»РµРєСЃ Р’РёС‚Р°РІРёС‚', 'Р’РёС‚Р°РјР°РєСЃ', 'Р’РёС‚Р°РјРёРЅС‹', 35000, 750, 'РЎР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРЅС‹Р№ РїРѕР»РёРІРёС‚Р°РјРёРЅРЅС‹Р№ РєРѕРјРїР»РµРєСЃ'],
                ['prod-008', 'Р’РёС‚Р°РјРёРЅ D3 2000 IU', 'Р’РёС‚Р°РјР°РєСЃ', 'Р’РёС‚Р°РјРёРЅС‹', 22000, 1100, 'РҐРѕР»РµРєР°Р»СЊС†РёС„РµСЂРѕР» РґР»СЏ РєРѕСЃС‚РµР№ Рё РёРјРјСѓРЅРЅРѕР№ СЃРёСЃС‚РµРјС‹'],
                ['prod-011', 'РР±СѓРїСЂРѕС„РµРЅ 400 РјРі', 'РЈР·С„Р°СЂРј', 'РћР±РµР·Р±РѕР»РёРІР°СЋС‰РёРµ', 7000, 2500, 'РџСЂРѕС‚РёРІРѕРІРѕСЃРїР°Р»РёС‚РµР»СЊРЅС‹Р№ Р°РЅР°Р»СЊРіРµС‚РёРє'],
                ['prod-012', 'РџР°СЂР°С†РµС‚Р°РјРѕР» 500 РјРі', 'РЈР·С„Р°СЂРј', 'РћР±РµР·Р±РѕР»РёРІР°СЋС‰РёРµ', 5000, 3000, 'РљР»Р°СЃСЃРёС‡РµСЃРєРѕРµ Р¶Р°СЂРѕРїРѕРЅРёР¶Р°СЋС‰РµРµ Рё Р±РѕР»РµСѓС‚РѕР»СЏСЋС‰РµРµ'],
                ['prod-016', 'РќР°С‚СЂРёСЏ С…Р»РѕСЂРёРґ 0.9%', 'РЈР·С„Р°СЂРј', 'Р Р°СЃС‚РІРѕСЂС‹', 4500, 5000, 'Р¤РёР·РёРѕР»РѕРіРёС‡РµСЃРєРёР№ СЂР°СЃС‚РІРѕСЂ РґР»СЏ РёРЅС„СѓР·РёР№'],
                ['prod-020', 'Р›РѕСЂР°С‚Р°РґРёРЅ 10 РјРі', 'РЈР·С„Р°СЂРј', 'РђРЅС‚РёРіРёСЃС‚Р°РјРёРЅРЅС‹Рµ', 6000, 2200, 'РџСЂРѕС‚РёРІРѕР°Р»Р»РµСЂРіРёС‡РµСЃРєРёР№ РїСЂРµРїР°СЂР°С‚ II РїРѕРєРѕР»РµРЅРёСЏ'],
            ];
            for (const p of prods) {
                await q('INSERT INTO products (guid, name, manufacturer, category, price, stock, description) VALUES ($1,$2,$3,$4,$5,$6,$7)', p);
            }
        }

        res.json({ success: true, message: 'вњ… Database initialized!' });
    } catch (e) {
        console.error('Init DB error:', e);
        res.status(500).json({ error: e.message });
    }
});

// 404 catch-all
app.all('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint РЅРµ РЅР°Р№РґРµРЅ',
        debug: {
            url: req.url,
            originalUrl: req.originalUrl,
            params: req.params
        }
    });
});

// Standalone runner setup (non-Vercel)
const PORT = process.env.PORT || 3006;
if (process.env.NODE_ENV !== 'serverless') {
    app.listen(PORT, () => {
        console.log(`рџљЂ STANDALONE Backend running on port ${PORT}`);
    });
}

export default (req, res) => {
    return app(req, res);
};


