const fs = require('fs');

// Patch api.js
let apiPath = 'src/services/api.js';
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('getSettings()')) {
    apiContent = apiContent.replace(
        "async getOrders() {",
        `async getSettings() {
        return callApi({ method: 'get', url: '/admin/settings', action: 'Ошибка загрузки настроек' });
    },
    async updateSettings(data) {
        return callApi({ method: 'put', url: '/admin/settings', data, action: 'Ошибка обновления настроек' });
    },
    async getOrders() {`
    );
    fs.writeFileSync(apiPath, apiContent, 'utf8');
    console.log('Patched api.js');
}

// Patch AdminPage.jsx
let adminPath = 'src/pages/AdminPage.jsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Add Settings size
if (!adminContent.includes('Settings')) {
    adminContent = adminContent.replace(
        "import { Users, LayoutGrid, UserPlus, Plus, Search, RefreshCw, Loader2, MessageSquare, Shield, Check, X, Edit, Trash2, Package, FileText, Eye } from 'lucide-react';",
        "import { Users, LayoutGrid, UserPlus, Plus, Search, RefreshCw, Loader2, MessageSquare, Shield, Check, X, Edit, Trash2, Package, FileText, Eye, Settings } from 'lucide-react';"
    );
}

// Add state
if (!adminContent.includes('const [systemSettings, setSystemSettings]')) {
    adminContent = adminContent.replace(
        "const [activeTab, setActiveTab] = useState('users');",
        "const [systemSettings, setSystemSettings] = useState({ auto_deduct_stock: false });\n    const [activeTab, setActiveTab] = useState('users');"
    );
}

// Load data
if (!adminContent.includes("promises.push(adminAPI.getSettings());")) {
    adminContent = adminContent.replace(
        "if (activeTab === 'orders' && canManageCatalog) {\n                promises.push(adminAPI.getOrders());\n            }",
        `if (activeTab === 'orders' && canManageCatalog) {
                promises.push(adminAPI.getOrders());
            } else if (activeTab === 'settings' && canManageCatalog) {
                promises.push(adminAPI.getSettings());
            }`
    );
    
    adminContent = adminContent.replace(
        "if (activeTab === 'orders') setOrders(results[1] || []);",
        `if (activeTab === 'orders') setOrders(results[1] || []);
                if (activeTab === 'settings') setSystemSettings(results[1] || { auto_deduct_stock: false });`
    );
}

// Toggle handler
if (!adminContent.includes("handleToggleAutoDeduct")) {
    adminContent = adminContent.replace(
        "const handleUpdateOrderStatus = async",
        `const handleToggleAutoDeduct = async () => {
        try {
            const newSettings = { ...systemSettings, auto_deduct_stock: !systemSettings.auto_deduct_stock };
            await adminAPI.updateSettings(newSettings);
            setSystemSettings(newSettings);
            setSuccessMessage('Настройки успешно обновлены');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleUpdateOrderStatus = async`
    );
}

// Tab button
if (!adminContent.includes("setActiveTab('settings')")) {
    adminContent = adminContent.replace(
        "Заказы\n                                </button>\n                            )}",
        `Заказы
                                </button>
                                <button 
                                    className={\`admin-tab \${activeTab === 'settings' ? 'active' : ''}\`}
                                    onClick={() => setActiveTab('settings')}
                                >
                                    <Settings size={18} />
                                    Настройки
                                </button>
                            )}`
    );
}

// Content
if (!adminContent.includes("activeTab === 'settings' && canManageCatalog &&")) {
    adminContent = adminContent.replace(
        "{activeTab === 'orders' && canManageCatalog && (",
        `{activeTab === 'settings' && canManageCatalog && (
                                    <div className="settings-panel" style={{padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)'}}>
                                        <h2>Настройки системы</h2>
                                        <div className="setting-item" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border)'}}>
                                            <div>
                                                <h3 style={{marginBottom: '8px'}}>Автоматическое списание остатков</h3>
                                                <p style={{color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px'}}>Если включено, остатки товаров будут автоматически списываться со склада в тот момент, когда менеджер переводит заказ в статус "В обработке". Если выключено — остатки нужно корректировать вручную.</p>
                                            </div>
                                            <label className="toggle-switch" style={{position: 'relative', display: 'inline-block', width: '60px', height: '34px'}}>
                                                <input type="checkbox" checked={systemSettings.auto_deduct_stock} onChange={handleToggleAutoDeduct} style={{opacity: 0, width: 0, height: 0}} />
                                                <span className="slider round" style={{position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: systemSettings.auto_deduct_stock ? '#10b981' : '#cbd5e1', transition: '.4s', borderRadius: '34px'}}>
                                                    <span style={{position: 'absolute', content: '""', height: '26px', width: '26px', left: systemSettings.auto_deduct_stock ? '30px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%'}}></span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                
                                {activeTab === 'orders' && canManageCatalog && (`
    );
}

fs.writeFileSync(adminPath, adminContent, 'utf8');
console.log('Patched AdminPage.jsx Settings');
