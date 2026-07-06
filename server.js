import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
const PORT = 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'CpTestSecret2024_LocalDev';
const ADMIN_SECRET_URL = process.env.ADMIN_SECRET_URL || 'cp-admin-2024';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'AdminAccess@2024';

app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================================
//  IN-MEMORY DATABASE (тестовый режим)
// ============================================================
const db = {
  users: [],
  products: [],
  orders: [],
  order_items: [],
  cart_items: [],
  settings: { auto_deduct_stock: false },
  debts: [],
  documents: [],
  claims: [],
  certificates: [],
  otp_codes: [],
  chat_conversations: [],
  chat_messages: [],
  events: [],
  admin_logs: [],
  login_attempts: [],
  support_settings: { phone: '+998 (71) 207-01-52', email: 'info@cpharm.uz', work_hours: 'Пн-Пт 09:00-18:00' },
  _nextId: {}
};

function nextId(table) {
  if (!db._nextId[table]) db._nextId[table] = 1;
  return db._nextId[table]++;
}

// ============================================================
//  SEED DATA
// ============================================================
async function seedDatabase() {
  if (db.users.length > 0) return;

  // Developer (суперадмин)
  db.users.push({
    id: nextId('users'), email: 'developer',
    password: await bcrypt.hash('developer', 10),
    role: 'developer', company_name: 'Curatio Pharm Dev', contact_person: 'System Developer',
    phone: '+998000000000', address: 'Tashkent', is_active: true, must_change_password: false,
    created_at: new Date().toISOString()
  });

  // Admin
  db.users.push({
    id: nextId('users'), email: 'admin',
    password: await bcrypt.hash('admin', 10),
    role: 'admin', company_name: 'Curatio Pharm', contact_person: 'Администратор',
    phone: '+998712070152', address: 'Ташкент, Юнусабадский р-н, ул. Карима Зарипова, 3',
    is_active: true, must_change_password: false, created_at: new Date().toISOString()
  });

  // Manager
  db.users.push({
    id: nextId('users'), email: 'manager',
    password: await bcrypt.hash('manager', 10),
    role: 'manager', company_name: 'Curatio Pharm', contact_person: 'Менеджер Отдела',
    phone: '+998712070152', address: 'Ташкент', is_active: true, must_change_password: false,
    created_at: new Date().toISOString()
  });

  // Client
  const clients = [
    { email: 'client', password: 'client', company: 'Test Client', person: 'Клиент' }
  ];
  for (const c of clients) {
    db.users.push({
      id: nextId('users'), email: c.email,
      password: await bcrypt.hash(c.password || 'client', 10),
      role: 'client', company_name: c.company, contact_person: c.person,
      phone: '+998901234567', address: 'Ташкент', is_active: true, must_change_password: false,
      created_at: new Date().toISOString()
    });
  }

  // Products
  const products = [
    { name: 'Амоксициллин 500мг', manufacturer: 'Berlin-Chemie AG', category: 'Антибиотики', price: 45000, stock: 500, description: 'Антибиотик широкого спектра действия' },
    { name: 'Парацетамол 500мг', manufacturer: 'Rompharm', category: 'Обезболивающие', price: 12000, stock: 1000, description: 'Жаропонижающее и обезболивающее средство' },
    { name: 'Витамин С 1000мг', manufacturer: 'Bayer AG', category: 'Витамины', price: 35000, stock: 800, description: 'Аскорбиновая кислота, поддержка иммунитета' },
    { name: 'Омепразол 20мг', manufacturer: 'Sandoz', category: 'ЖКТ', price: 28000, stock: 600, description: 'Ингибитор протонной помпы' },
    { name: 'Лоратадин 10мг', manufacturer: 'KRKA', category: 'Антигистаминные', price: 18000, stock: 750, description: 'Антигистаминный препарат II поколения' },
    { name: 'Ибупрофен 400мг', manufacturer: 'Reckitt Benckiser', category: 'Обезболивающие', price: 22000, stock: 900, description: 'НПВС, противовоспалительное' },
    { name: 'Цефтриаксон 1г', manufacturer: 'Fresenius Kabi', category: 'Антибиотики', price: 65000, stock: 300, description: 'Цефалоспорин III поколения' },
    { name: 'Метформин 850мг', manufacturer: 'Merck', category: 'Эндокринология', price: 32000, stock: 400, description: 'Гипогликемическое средство' },
    { name: 'Тералиджен 5мг', manufacturer: 'SI Sia Finnera', category: 'Психоневрология', price: 78000, stock: 200, description: 'Нейролептик, антипсихотический препарат' },
    { name: 'Диклофенак гель 5%', manufacturer: 'Hemofarm', category: 'Обезболивающие', price: 25000, stock: 650, description: 'Местное НПВС, гель для наружного применения' },
    { name: 'Аторвастатин 20мг', manufacturer: 'Pfizer', category: 'Кардиология', price: 42000, stock: 350, description: 'Гиполипидемическое средство, статин' },
    { name: 'Азитромицин 500мг', manufacturer: 'Pliva', category: 'Антибиотики', price: 55000, stock: 450, description: 'Антибиотик-макролид' }
  ];
  for (const p of products) {
    db.products.push({
      id: nextId('products'), guid: crypto.randomUUID(), ...p,
      is_active: true, discount: 0, discount_label: null, created_at: new Date().toISOString()
    });
  }

  // Sample debts
  db.debts.push({ id: nextId('debts'), user_id: 4, amount: 1500000, credit_limit: 5000000, overdue_amount: 0, currency: 'UZS' });

  // Sample event
  db.events.push({
    id: nextId('events'), title: 'Добро пожаловать на обновлённый сайт!',
    description: 'Мы обновили наш сайт — теперь он ещё удобнее и красивее.',
    type: 'ribbon', image_url: null, background_color: '#10b981', text_color: '#ffffff',
    link_url: '/about', is_active: true,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 1, created_at: new Date().toISOString()
  });

  // FAQ for AI chat
  db._faq = [
    { keywords: ['доставка', 'доставку', 'привезти', 'привезут'], answer: 'Доставка осуществляется по всему Узбекистану. Заказы, оформленные до 12:00, доставляются в тот же день по Ташкенту и области. Стоимость доставки зависит от региона.' },
    { keywords: ['цена', 'цены', 'стоимость', 'прайс'], answer: 'Актуальные цены доступны в каталоге вашего личного кабинета. Для получения индивидуальных условий свяжитесь с вашим менеджером.' },
    { keywords: ['оплата', 'оплатить', 'оплату', 'платеж'], answer: 'Мы принимаем безналичную оплату по счёту. Отсрочка платежа — по договорённости с менеджером.' },
    { keywords: ['возврат', 'вернуть', 'претензия'], answer: 'Возврат товара возможен в соответствии с условиями договора. Для оформления претензии используйте раздел «Претензии» в личном кабинете.' },
    { keywords: ['сертификат', 'сертификаты', 'качество'], answer: 'Сертификаты качества на все препараты доступны в разделе «Сертификаты» вашего личного кабинета. Каждая партия проходит проверку соответствия GDP.' },
    { keywords: ['регистрация', 'зарегистрироваться', 'аккаунт'], answer: 'Регистрация новых клиентов осуществляется через администратора. Оставьте заявку по телефону +998 (71) 207-01-52 или через форму на сайте.' },
    { keywords: ['график', 'время', 'работаете', 'часы'], answer: 'Мы работаем с понедельника по пятницу, с 09:00 до 18:00. Обеденный перерыв с 13:00 до 14:00. Выходные: суббота, воскресенье.' },
    { keywords: ['адрес', 'где', 'офис', 'находитесь'], answer: 'Главный офис: г. Ташкент, Юнусабадский район, ул. Карима Зарипова, 3. Розничная аптека: г. Ташкент, Мирабадский район, ул. Кичик Бешегоч, 313.' },
    { keywords: ['скидка', 'скидки', 'акция', 'акции'], answer: 'Актуальные акции и скидки отображаются в каталоге вашего личного кабинета. Следите за обновлениями!' },
    { keywords: ['привет', 'здравствуйте', 'добрый'], answer: 'Здравствуйте! Я виртуальный помощник Curatio Pharm. Чем могу помочь?' }
  ];

  console.log(`✅ Seed: ${db.users.length} users, ${db.products.length} products, ${db.events.length} events`);
}

// ============================================================
//  MIDDLEWARE
// ============================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Токен не предоставлен' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

function requireAdmin(req, res, next) {
  if (!['admin', 'developer', 'manager', 'hr', 'support', 'operator', 'ai'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Доступ запрещён: требуются права администратора' });
  }
  next();
}

function requireDeveloper(req, res, next) {
  if (req.user.role !== 'developer') {
    return res.status(403).json({ error: 'Доступ запрещён: требуются права разработчика' });
  }
  next();
}

function logAction(adminId, action, targetUserId = null, details = '') {
  db.admin_logs.push({
    id: nextId('admin_logs'), admin_id: adminId, action, target_user_id: targetUserId,
    details, created_at: new Date().toISOString()
  });
}

function sanitizeUser(u) {
  const { password, ...safe } = u;
  return {
    ...safe,
    companyName: safe.company_name,
    contactPerson: safe.contact_person,
    isActive: Boolean(safe.is_active),
    mustChangePassword: Boolean(safe.must_change_password),
    createdAt: safe.created_at
  };
}

function formatCartItem(item) {
  const product = db.products.find(p => p.id === item.product_id);
  const price = Number(item.price || 0);
  const quantity = Number(item.quantity || 0);
  return {
    ...item,
    productId: item.product_id,
    productName: item.product_name,
    stock: product ? Number(product.stock || 0) : 0,
    total: price * quantity
  };
}

function formatCartResponse(items) {
  const normalizedItems = items.map(formatCartItem);
  return {
    success: true,
    items: normalizedItems,
    totalItems: normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    total: normalizedItems.reduce((sum, item) => sum + Number(item.total || 0), 0)
  };
}

function formatOrder(order, items = []) {
  return {
    ...order,
    orderNumber: order.order_number,
    totalAmount: order.total_amount,
    itemsCount: order.items_count,
    deliveryAddress: order.delivery_address,
    contactPhone: order.contact_phone,
    createdAt: order.created_at,
    items: items.map(item => ({
      ...item,
      productId: item.product_id,
      productName: item.product_name
    }))
  };
}

// ============================================================
//  AUTH ENDPOINTS
// ============================================================
app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'test-local', timestamp: new Date().toISOString() }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = db.users.find(u => u.email === login && u.is_active);
    if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверный логин или пароль' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    logAction(user.id, 'login', user.id, `Вход: ${user.email}`);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/verify', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user || !user.is_active) return res.status(401).json({ error: 'Пользователь не найден' });
  res.json({ valid: true, user: sanitizeUser(user) });
});

// OTP Login
app.post('/api/auth/login-otp', async (req, res) => {
  try {
    const { code } = req.body;
    const otp = db.otp_codes.find(o => o.code === code && !o.used && new Date(o.expires_at) > new Date());
    if (!otp) return res.status(401).json({ error: 'Недействительный или просроченный одноразовый код' });

    const user = db.users.find(u => u.id === otp.user_id);
    if (!user || !user.is_active) return res.status(401).json({ error: 'Пользователь деактивирован' });

    // Mark OTP as used
    otp.used = true;
    otp.used_at = new Date().toISOString();

    // Force password change
    user.must_change_password = true;

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    logAction(user.id, 'otp_login', user.id, `Вход по OTP: ${user.email}`);
    res.json({ token, user: sanitizeUser(user), must_change_password: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Force password change
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    user.password = await bcrypt.hash(new_password, 10);
    user.must_change_password = false;
    logAction(user.id, 'password_changed', user.id, 'Смена пароля');
    res.json({ success: true, message: 'Пароль успешно изменён' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Register request (заявка на кабинет)
app.post('/api/auth/register-request', async (req, res) => {
  const { company_name, contact_person, phone, email } = req.body;
  logAction(0, 'register_request', null, `Заявка: ${company_name}, ${contact_person}, ${phone}, ${email}`);
  res.json({ success: true, message: 'Ваша заявка принята! Наш менеджер свяжется с вами в ближайшее время.' });
});

// Admin login
app.post('/api/admin/:secret/login', async (req, res) => {
  try {
    if (req.params.secret !== ADMIN_SECRET_URL) return res.status(404).json({ error: 'Endpoint не найден' });
    const { login, password, adminKey } = req.body;
    if (!adminKey || adminKey !== ADMIN_SECRET_KEY) return res.status(401).json({ error: 'Доступ запрещён' });
    const user = db.users.find(u => u.email === login && u.is_active && ['admin', 'developer', 'manager', 'hr', 'support', 'operator', 'ai'].includes(u.role));
    if (!user) return res.status(401).json({ error: 'Неверные данные или недостаточно прав' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверные данные' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    logAction(user.id, 'admin_login', user.id, `Вход админа: ${user.email}`);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
//  ADMIN ENDPOINTS
// ============================================================

app.get('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
    res.json(db.settings);
});

app.put('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    res.json(db.settings);
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    totalPartners: db.users.filter(u => ['client', 'partner'].includes(u.role)).length,
    totalProducts: db.products.filter(p => p.is_active).length,
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter(o => o.status === 'pending').length,
    activeChats: db.chat_conversations.filter(c => c.status !== 'closed').length,
    pendingOtp: db.otp_codes.filter(o => !o.used && new Date(o.expires_at) > new Date()).length
  });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.users.map(sanitizeUser));
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      email,
      password,
      role = 'client',
      company_name = req.body.companyName,
      contact_person = req.body.contactPerson,
      phone,
      address
    } = req.body;
    if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

    const hashed = await bcrypt.hash(password || 'Temp1234!', 10);
    const user = {
      id: nextId('users'), email, password: hashed, role,
      company_name: company_name || '', contact_person: contact_person || '',
      phone: phone || '', address: address || '', is_active: true,
      must_change_password: true, created_at: new Date().toISOString()
    };
    db.users.push(user);
    logAction(req.user.id, 'create_user', user.id, `Создан: ${email} (${role})`);
    res.json({ user: sanitizeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (req.body.companyName !== undefined) req.body.company_name = req.body.companyName;
  if (req.body.contactPerson !== undefined) req.body.contact_person = req.body.contactPerson;
  if (req.body.isActive !== undefined) req.body.is_active = req.body.isActive;
  if (req.body.mustChangePassword !== undefined) req.body.must_change_password = req.body.mustChangePassword;
  Object.assign(user, req.body);
  logAction(req.user.id, 'update_user', user.id, `Обновлён: ${user.email}`);
  res.json({ user: sanitizeUser(user) });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  user.is_active = false;
  logAction(req.user.id, 'deactivate_user', user.id, `Деактивирован: ${user.email}`);
  res.json({ message: 'Пользователь деактивирован' });
});

// OTP Generation
app.post('/api/admin/generate-otp', authenticateToken, requireAdmin, (req, res) => {
  const { user_id } = req.body;
  const user = db.users.find(u => u.id === user_id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  // Invalidate old OTPs
  db.otp_codes.filter(o => o.user_id === user_id && !o.used).forEach(o => { o.used = true; });

  const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
  const otp = {
    id: nextId('otp_codes'), code, user_id, created_by: req.user.id,
    used: false, used_at: null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  };
  db.otp_codes.push(otp);
  logAction(req.user.id, 'generate_otp', user_id, `OTP для ${user.email}: ${code}`);
  res.json({ code, expires_at: otp.expires_at, user_email: user.email });
});


// ============================================================
//  ADMIN ORDERS
// ============================================================
app.get('/api/admin/orders', authenticateToken, requireAdmin, (req, res) => {
  const allOrders = db.orders.map(o => {
    const u = db.users.find(user => user.id === o.user_id);
    const items = db.order_items.filter(i => i.order_id === o.id);
    return { ...o, user: u ? sanitizeUser(u) : {}, items };
  });
  // Sort by date DESC
  allOrders.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(allOrders);
});

app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  
  const previousStatus = order.status;
  order.status = req.body.status;

  if (
    db.settings.auto_deduct_stock &&
    req.body.status === 'processing' &&
    previousStatus !== 'processing' &&
    !order.stock_deducted
  ) {
    const items = db.order_items.filter(i => i.order_id === order.id);
    for (const item of items) {
      const product = db.products.find(p => p.id === item.product_id);
      if (product) {
        product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0));
      }
    }
    order.stock_deducted = true;
  }
  
  // Send message to chat
  let conv = db.chat_conversations.find(c => c.user_id === order.user_id && c.status !== 'closed');
  if (conv && req.body.status !== 'pending') {
    const statusMap = { processing: 'принят в обработку', shipped: 'отправлен', delivered: 'доставлен', cancelled: 'отклонен' };
    const statusText = statusMap[req.body.status] || 'обновлен';
    const sysMsg = {
      id: nextId('chat_messages'), conversation_id: conv.id, sender_type: 'ai', sender_id: null,
      message: '🔔 Ваш заказ ' + order.order_number + ' ' + statusText + '.',
      created_at: new Date().toISOString()
    };
    db.chat_messages.push(sysMsg);
    conv.updated_at = new Date().toISOString();
  }
  
  logAction(req.user.id, 'update_order_status', order.user_id, 'Статус заказа ' + order.order_number + ': ' + order.status);
  res.json(order);
});

app.post('/api/admin/orders/:id/document', authenticateToken, requireAdmin, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  
  const doc = {
    id: nextId('documents'), user_id: order.user_id, type: req.body.type || 'invoice',
    number: 'DOC-' + Date.now().toString(36).toUpperCase(),
    date: new Date().toISOString(), amount: order.total_amount, status: 'unpaid',
    fileUrl: '/dummy-invoice.pdf', order_id: order.id
  };
  db.documents.push(doc);
  logAction(req.user.id, 'create_document', order.user_id, 'Документ ' + doc.number + ' для ' + order.order_number);
  res.json(doc);
});

// ============================================================
//  PRODUCTS ENDPOINTS
// ============================================================

app.get('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.products);
});

app.post('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  const product = {
    id: nextId('products'),
    guid: crypto.randomUUID(),
    name: req.body.name || 'Без названия',
    manufacturer: req.body.manufacturer || '',
    category: req.body.category || 'Общее',
    price: Number(req.body.price) || 0,
    stock: Number(req.body.stock) || 0,
    image_url: req.body.image_url || null,
    description: req.body.description || '',
    is_active: true,
    discount: Number(req.body.discount) || 0,
    discount_label: req.body.discount_label || null,
    created_at: new Date().toISOString()
  };
  db.products.push(product);
  logAction(req.user.id, 'create_product', null, 'Товар: ' + product.name);
  res.json(product);
});

app.put('/api/admin/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  
  if (req.body.name !== undefined) product.name = req.body.name;
  if (req.body.manufacturer !== undefined) product.manufacturer = req.body.manufacturer;
  if (req.body.category !== undefined) product.category = req.body.category;
  if (req.body.price !== undefined) product.price = Number(req.body.price) || 0;
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock) || 0;
  if (req.body.image_url !== undefined) product.image_url = req.body.image_url;
  if (req.body.description !== undefined) product.description = req.body.description;
  if (req.body.isActive !== undefined) product.is_active = Boolean(req.body.isActive);
  if (req.body.is_active !== undefined) product.is_active = Boolean(req.body.is_active);
  if (req.body.discount !== undefined) product.discount = Number(req.body.discount) || 0;
  if (req.body.discount_label !== undefined) product.discount_label = req.body.discount_label;
  if (req.body.isActive !== undefined) product.is_active = req.body.isActive;
  if (req.body.is_active !== undefined) product.is_active = req.body.is_active;

  logAction(req.user.id, 'update_product', null, 'Товар обновлен: ' + product.name);
  res.json(product);
});

app.get('/api/products', (req, res) => {
  let products = db.products.filter(p => p.is_active);
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(s) || p.manufacturer.toLowerCase().includes(s));
  }
  if (req.query.category) products = products.filter(p => p.category === req.query.category);
  res.json(products);
});

app.get('/api/products/category/:category', (req, res) => {
  res.json(db.products.filter(p => p.is_active && p.category === req.params.category));
});

app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id) && p.is_active);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  res.json(product);
});

// ============================================================
//  USER PROFILE
// ============================================================
app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(sanitizeUser(user));
});

app.put('/api/users/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { contact_person, phone, address, company_name } = req.body;
  if (contact_person) user.contact_person = contact_person;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (company_name) user.company_name = company_name;
  res.json(sanitizeUser(user));
});

// ============================================================
//  ORDERS
// ============================================================
app.get('/api/orders', authenticateToken, (req, res) => {
  const orders = db.orders.filter(o => o.user_id === req.user.id);
  res.json({
    success: true,
    orders: orders.map(o => formatOrder(o, db.order_items.filter(i => i.order_id === o.id)))
  });
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id) && o.user_id === req.user.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  const items = db.order_items.filter(i => i.order_id === order.id);
  res.json({ success: true, order: formatOrder(order, items) });
});

app.post('/api/orders', authenticateToken, (req, res) => {
  const cartItems = db.cart_items.filter(c => c.user_id === req.user.id);
  if (cartItems.length === 0) return res.status(400).json({ error: 'Корзина пуста' });

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryAddress = req.body.delivery_address || req.body.deliveryAddress || '';
  const contactPhone = req.body.contact_phone || req.body.contactPhone || '';
  const order = {
    id: nextId('orders'), user_id: req.user.id,
    order_number: `ORD-${Date.now().toString(36).toUpperCase()}`,
    status: 'pending', total_amount: total,
    items_count: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    delivery_address: deliveryAddress,
    contact_phone: contactPhone,
    notes: req.body.notes || '',
    created_at: new Date().toISOString()
  };
  db.orders.push(order);

  for (const item of cartItems) {
    db.order_items.push({
      id: nextId('order_items'), order_id: order.id,
      product_id: item.product_id, product_name: item.product_name,
      quantity: item.quantity, price: item.price, total: item.price * item.quantity
    });
  }
  db.cart_items = db.cart_items.filter(c => c.user_id !== req.user.id);
  logAction(req.user.id, 'create_order', req.user.id, `Заказ ${order.order_number}: ${total} UZS`);
  const items = db.order_items.filter(i => i.order_id === order.id);
  res.json({ success: true, order: formatOrder(order, items) });
});

app.put('/api/orders/:id/cancel', authenticateToken, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id) && o.user_id === req.user.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'Можно отменить только ожидающий заказ' });
  order.status = 'cancelled';
  logAction(req.user.id, 'cancel_order', req.user.id, `Отменён: ${order.order_number}`);
  const items = db.order_items.filter(i => i.order_id === order.id);
  res.json({ success: true, order: formatOrder(order, items) });
});

// ============================================================
//  CART
// ============================================================
app.get('/api/cart', authenticateToken, (req, res) => {
  const items = db.cart_items.filter(c => c.user_id === req.user.id);
  res.json(formatCartResponse(items));
});

app.post('/api/cart', authenticateToken, (req, res) => {
  const product_id = Number(req.body.product_id || req.body.productId);
  const quantity = Math.max(1, Number(req.body.quantity || 1));
  const product = db.products.find(p => p.id === product_id && p.is_active);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });

  const existing = db.cart_items.find(c => c.user_id === req.user.id && c.product_id === product_id);
  if (existing) {
    existing.quantity += quantity;
    return res.json({ success: true, item: formatCartItem(existing) });
  }

  const item = {
    id: nextId('cart_items'), user_id: req.user.id, product_id,
    product_name: product.name, quantity, price: product.price
  };
  db.cart_items.push(item);
  res.json({ success: true, item: formatCartItem(item) });
});

app.put('/api/cart/:id', authenticateToken, (req, res) => {
  const item = db.cart_items.find(c => c.id === parseInt(req.params.id) && c.user_id === req.user.id);
  if (!item) return res.status(404).json({ error: 'Элемент корзины не найден' });
  item.quantity = Math.max(1, Number(req.body.quantity || 1));
  res.json({ success: true, item: formatCartItem(item) });
});

app.delete('/api/cart/:id', authenticateToken, (req, res) => {
  db.cart_items = db.cart_items.filter(c => !(c.id === parseInt(req.params.id) && c.user_id === req.user.id));
  res.json({ message: 'Удалено' });
});

app.delete('/api/cart', authenticateToken, (req, res) => {
  db.cart_items = db.cart_items.filter(c => c.user_id !== req.user.id);
  res.json({ message: 'Корзина очищена' });
});

// ============================================================
//  CABINET DATA
// ============================================================
app.get('/api/cabinet/debts', authenticateToken, (req, res) => {
  const debt = db.debts.find(d => d.user_id === req.user.id);
  res.json(debt || { amount: 0, credit_limit: 0, overdue_amount: 0, currency: 'UZS' });
});

app.get('/api/cabinet/documents', authenticateToken, (req, res) => {
  res.json(db.documents.filter(d => d.user_id === req.user.id));
});

app.get('/api/cabinet/claims', authenticateToken, (req, res) => {
  res.json(db.claims.filter(c => c.user_id === req.user.id));
});

app.post('/api/cabinet/claims', authenticateToken, (req, res) => {
  const claim = {
    id: nextId('claims'), user_id: req.user.id, ...req.body,
    status: 'open', admin_comment: null, created_at: new Date().toISOString()
  };
  db.claims.push(claim);
  res.json(claim);
});

app.get('/api/cabinet/certificates', authenticateToken, (req, res) => {
  res.json(db.certificates);
});

// ============================================================
//  CHAT SYSTEM
// ============================================================
app.post('/api/chat/start', authenticateToken, (req, res) => {
  // Check for existing open conversation
  let conv = db.chat_conversations.find(c => c.user_id === req.user.id && c.status !== 'closed');
  if (!conv) {
    conv = {
      id: nextId('chat_conversations'), user_id: req.user.id,
      status: 'ai', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    db.chat_conversations.push(conv);

    // AI greeting
    db.chat_messages.push({
      id: nextId('chat_messages'), conversation_id: conv.id,
      sender_type: 'ai', sender_id: null,
      message: 'Здравствуйте! Я виртуальный помощник Curatio Pharm. Задайте мне вопрос, и я постараюсь помочь. Если потребуется, вы всегда можете связаться с оператором.',
      created_at: new Date().toISOString()
    });
  }
  const messages = db.chat_messages.filter(m => m.conversation_id === conv.id);
  res.json({ conversation: conv, messages });
});

app.get('/api/chat/messages/:conversationId', authenticateToken, (req, res) => {
  const conv = db.chat_conversations.find(c => c.id === parseInt(req.params.conversationId));
  if (!conv) return res.status(404).json({ error: 'Чат не найден' });
  const messages = db.chat_messages.filter(m => m.conversation_id === conv.id);
  res.json({ conversation: conv, messages });
});

app.post('/api/chat/send', authenticateToken, (req, res) => {
  const { conversation_id, message } = req.body;
  const conv = db.chat_conversations.find(c => c.id === conversation_id);
  if (!conv) return res.status(404).json({ error: 'Чат не найден' });

  // Save user message
  const userMsg = {
    id: nextId('chat_messages'), conversation_id, sender_type: 'user',
    sender_id: req.user.id, message, created_at: new Date().toISOString()
  };
  db.chat_messages.push(userMsg);
  conv.updated_at = new Date().toISOString();

  // AI response (if chat is in AI mode)
  let aiResponse = null;
  if (conv.status === 'ai') {
    const lowerMsg = message.toLowerCase();
    const faqMatch = db._faq.find(f => f.keywords.some(k => lowerMsg.includes(k)));
    const aiText = faqMatch ? faqMatch.answer : 'К сожалению, я не могу ответить на этот вопрос. Пожалуйста, нажмите «Связаться с оператором» для получения помощи от специалиста.';

    aiResponse = {
      id: nextId('chat_messages'), conversation_id, sender_type: 'ai',
      sender_id: null, message: aiText, created_at: new Date().toISOString()
    };
    db.chat_messages.push(aiResponse);
  }

  res.json({ userMessage: userMsg, aiResponse });
});

app.post('/api/chat/request-operator', authenticateToken, (req, res) => {
  const { conversation_id } = req.body;
  const conv = db.chat_conversations.find(c => c.id === conversation_id);
  if (!conv) return res.status(404).json({ error: 'Чат не найден' });
  conv.status = 'operator';
  conv.updated_at = new Date().toISOString();

  const sysMsg = {
    id: nextId('chat_messages'), conversation_id, sender_type: 'ai',
    sender_id: null, message: '🔔 Вы были переключены на оператора. Пожалуйста, подождите — специалист скоро ответит.',
    created_at: new Date().toISOString()
  };
  db.chat_messages.push(sysMsg);
  res.json({ conversation: conv, message: sysMsg });
});

// Admin chat endpoints
app.get('/api/admin/chats', authenticateToken, requireAdmin, (req, res) => {
  const convs = db.chat_conversations.map(c => {
    const user = db.users.find(u => u.id === c.user_id);
    const msgs = db.chat_messages.filter(m => m.conversation_id === c.id);
    const lastMsg = msgs[msgs.length - 1];
    return {
      ...c, user: user ? sanitizeUser(user) : null,
      last_message: lastMsg, message_count: msgs.length
    };
  });
  res.json(convs);
});

app.post('/api/admin/chats/:id/reply', authenticateToken, requireAdmin, (req, res) => {
  const conv = db.chat_conversations.find(c => c.id === parseInt(req.params.id));
  if (!conv) return res.status(404).json({ error: 'Чат не найден' });

  const msg = {
    id: nextId('chat_messages'), conversation_id: conv.id,
    sender_type: 'operator', sender_id: req.user.id,
    message: req.body.message, created_at: new Date().toISOString()
  };
  db.chat_messages.push(msg);
  conv.status = 'operator';
  conv.updated_at = new Date().toISOString();
  res.json(msg);
});

app.put('/api/admin/chats/:id/close', authenticateToken, requireAdmin, (req, res) => {
  const conv = db.chat_conversations.find(c => c.id === parseInt(req.params.id));
  if (!conv) return res.status(404).json({ error: 'Чат не найден' });
  conv.status = 'closed';
  res.json({ message: 'Чат закрыт' });
});

// Support settings
app.get('/api/admin/support-settings', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.support_settings);
});

app.put('/api/admin/support-settings', authenticateToken, requireAdmin, (req, res) => {
  Object.assign(db.support_settings, req.body);
  res.json(db.support_settings);
});

app.get('/api/support-settings', (req, res) => {
  res.json(db.support_settings);
});

// ============================================================
//  EVENTS SYSTEM
// ============================================================
app.get('/api/events/active', (req, res) => {
  const now = new Date();
  const active = db.events.filter(e =>
    e.is_active && new Date(e.starts_at) <= now && new Date(e.ends_at) >= now
  );
  res.json(active);
});

app.get('/api/dev/events', authenticateToken, requireDeveloper, (req, res) => {
  res.json(db.events);
});

app.post('/api/dev/events', authenticateToken, requireDeveloper, (req, res) => {
  const event = {
    id: nextId('events'), ...req.body, created_by: req.user.id,
    is_active: true, created_at: new Date().toISOString()
  };
  db.events.push(event);
  logAction(req.user.id, 'create_event', null, `Событие: ${event.title}`);
  res.json(event);
});

app.put('/api/dev/events/:id', authenticateToken, requireDeveloper, (req, res) => {
  const event = db.events.find(e => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: 'Событие не найдено' });
  Object.assign(event, req.body);
  res.json(event);
});

app.delete('/api/dev/events/:id', authenticateToken, requireDeveloper, (req, res) => {
  db.events = db.events.filter(e => e.id !== parseInt(req.params.id));
  res.json({ message: 'Удалено' });
});

// ============================================================
//  DEVELOPER PANEL
// ============================================================
app.get('/api/dev/logs', authenticateToken, requireDeveloper, (req, res) => {
  const logs = db.admin_logs.map(log => {
    const admin = db.users.find(u => u.id === log.admin_id);
    const target = log.target_user_id ? db.users.find(u => u.id === log.target_user_id) : null;
    return {
      ...log,
      admin_name: admin ? admin.contact_person || admin.email : 'System',
      target_name: target ? target.contact_person || target.email : null
    };
  });
  res.json(logs.reverse());
});

app.get('/api/dev/stats', authenticateToken, requireDeveloper, (req, res) => {
  const totalRevenue = db.orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  res.json({
    users: { total: db.users.length, active: db.users.filter(u => u.is_active).length, clients: db.users.filter(u => u.role === 'client').length, admins: db.users.filter(u => u.role === 'admin').length },
    products: { total: db.products.length, active: db.products.filter(p => p.is_active).length },
    orders: { total: db.orders.length, pending: db.orders.filter(o => o.status === 'pending').length, completed: db.orders.filter(o => o.status === 'completed').length },
    revenue: totalRevenue,
    chats: { total: db.chat_conversations.length, active: db.chat_conversations.filter(c => c.status !== 'closed').length },
    events: { total: db.events.length, active: db.events.filter(e => e.is_active).length },
    otp: { total: db.otp_codes.length, unused: db.otp_codes.filter(o => !o.used).length },
    logs: db.admin_logs.length
  });
});

app.get('/api/dev/users-full', authenticateToken, requireDeveloper, (req, res) => {
  res.json(db.users.map(u => {
    const { password, ...safe } = u;
    return { ...safe, orders_count: db.orders.filter(o => o.user_id === u.id).length };
  }));
});

// Init DB (developer only in production, public in test)
app.get('/api/init-db', async (req, res) => {
  await seedDatabase();
  res.json({ message: 'Тестовая БД инициализирована', users: db.users.length, products: db.products.length });
});

// ============================================================
//  START
// ============================================================
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Curatio Pharm Test Backend`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📋 Тестовые аккаунты:`);
    console.log(`   Developer: developer / developer`);
    console.log(`   Admin:     admin / admin`);
    console.log(`   Manager:   manager / manager`);
    console.log(`   Client:    client / client\n`);
  });
});
