import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome, isBackofficeRole } from '../utils/roles';
import { useTheme, themes } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ordersAPI, cartAPI, cabinetAPI } from '../services/api';
import {
    User,
    LogOut,
    Package,
    FileText,
    Settings,
    X,
    Palette,
    Bell,
    Shield,
    ChevronRight,
    Check,
    Mail,
    Phone,
    Building,
    ShoppingBag,
    ShoppingCart,
    Percent,
    CreditCard,
    FileCheck,
    AlertCircle,
    Loader2,
    BarChart3,
    TrendingUp
} from 'lucide-react';
import Navbar from './Navbar';
import './CabinetPage.css';

const CabinetPage = () => {
    const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
    const { theme, setTheme } = useTheme();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [showSettings, setShowSettings] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState('profile');

    // State for active section modal
    const [activeSection, setActiveSection] = useState(null);

    // Profile form state - initialized from user data
    const [profile, setProfile] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
    });

    // Real data state
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState({ items: [], total: 0, totalItems: 0 });

    // Cabinet Data State
    const [debts, setDebts] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [claims, setClaims] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Load profile data when user changes
    useEffect(() => {
        if (user) {
            setProfile({
                name: user.contactPerson || user.email || '',
                company: user.companyName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const loadOrders = useCallback(async () => {
        try {
            const data = await ordersAPI.getOrders();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }, []);

    const loadCart = useCallback(async () => {
        try {
            const data = await cartAPI.getCart();
            if (data.success) {
                setCart(data);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }, []);

    const loadDebts = useCallback(async () => {
        setLoadingData(true);
        try {
            const data = await cabinetAPI.getDebts();
            if (data.success) setDebts(data.debt);
        } catch (e) { console.error(e); }
        setLoadingData(false);
    }, []);

    const loadDocuments = useCallback(async () => {
        setLoadingData(true);
        try {
            const data = await cabinetAPI.getDocuments();
            if (data.success) setDocuments(data.documents);
        } catch (e) { console.error(e); }
        setLoadingData(false);
    }, []);

    const loadClaims = useCallback(async () => {
        setLoadingData(true);
        try {
            const data = await cabinetAPI.getClaims();
            if (data.success) setClaims(data.claims);
        } catch (e) { console.error(e); }
        setLoadingData(false);
    }, []);

    const loadCertificates = useCallback(async () => {
        setLoadingData(true);
        try {
            const data = await cabinetAPI.getCertificates();
            if (data.success) setCertificates(data.certificates);
        } catch (e) { console.error(e); }
        setLoadingData(false);
    }, []);

    // Load orders and cart data
    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) {
            loadOrders();
            loadCart();
        }
    }, [authLoading, isAuthenticated, loadOrders, loadCart]);

    // Load data based on active section
    useEffect(() => {
        if (!isAuthenticated) return;

        if (activeSection === 'debts') loadDebts();
        else if (activeSection === 'documents') loadDocuments();
        else if (activeSection === 'claims') loadClaims();
        else if (activeSection === 'certificates') loadCertificates();
    }, [activeSection, isAuthenticated, loadDebts, loadDocuments, loadClaims, loadCertificates]);

    const handleCreateClaim = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const claimData = {
            type: formData.get('type'),
            description: formData.get('description'),
            orderId: formData.get('orderId')
        };
        try {
            await cabinetAPI.createClaim(claimData);
            addToast('Претензия успешно отправлена', 'success');
            loadClaims(); // reload
            e.target.reset();
        } catch (error) {
            addToast('Ошибка при отправке претензии', 'error');
        }
    };

    // Redirect to login if not authenticated, or to role panel if staff
    React.useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        // Debug: log what role the user has
        if (user) {
            console.log('[CabinetPage] user.role =', user.role, '| isBackoffice =', isBackofficeRole(user.role), '| target =', getRoleHome(user.role));
        }
        // Redirect staff members to their role-specific panels
        if (user && isBackofficeRole(user.role)) {
            navigate(getRoleHome(user.role), { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate, user]);


    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleProfileChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'orders':
                return (
                    <div className="modal-table-container">
                        <table className="modal-table">
                            <thead>
                                <tr>
                                    <th>№ Заказа</th>
                                    <th>Дата</th>
                                    <th>Статус</th>
                                    <th>Сумма</th>
                                    <th>Позиций</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-state">Заказов нет</td></tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.orderNumber}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                                            <td>
                                                <span className={`status-badge ${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                                                    {order.status === 'pending' && 'Ожидает'}
                                                    {order.status === 'processing' && 'В обработке'}
                                                    {order.status === 'shipped' && 'Отправлен'}
                                                    {order.status === 'delivered' && 'Доставлен'}
                                                    {order.status === 'cancelled' && 'Отменен'}
                                                </span>
                                            </td>
                                            <td>{Number(order.totalAmount).toLocaleString()} сум</td>
                                            <td>{order.itemsCount}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case 'documents':
                return (
                    <div className="modal-table-container">
                        {loadingData ? <div className="loading"><Loader2 className="spin" /> Загрузка...</div> : (
                            <table className="modal-table">
                                <thead>
                                    <tr>
                                        <th>Номер</th>
                                        <th>Тип</th>
                                        <th>Дата</th>
                                        <th>Сумма</th>
                                        <th>Статус</th>
                                        <th>Скачать</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.length === 0 ? (
                                        <tr><td colSpan="6" className="empty-state">Документов нет</td></tr>
                                    ) : (
                                        documents.map(doc => (
                                            <tr key={doc.id}>
                                                <td>{doc.number}</td>
                                                <td>
                                                    {doc.type === 'invoice' && 'Счет-фактура'}
                                                    {doc.type === 'waybill' && 'Накладная'}
                                                    {doc.type === 'act' && 'Акт сверки'}
                                                </td>
                                                <td>{new Date(doc.date).toLocaleDateString('ru-RU')}</td>
                                                <td>{Number(doc.amount).toLocaleString()} сум</td>
                                                <td>
                                                    <span className={`status-badge ${doc.status === 'paid' ? 'success' : 'warning'}`}>
                                                        {doc.status === 'paid' ? 'Оплачен' : 'Не оплачен'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="icon-btn" onClick={() => window.open(doc.fileUrl || '#', '_blank')}>
                                                        <FileText size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case 'debts':
                return (
                    <div className="debt-dashboard">
                        {loadingData ? <div className="loading">Загрузка...</div> : (
                            <>
                                <div className={`debt-card ${Number(debts?.overdueAmount) > 0 ? 'danger' : 'success'}`}>
                                    <h3>Текущий долг</h3>
                                    <p className="amount">{Number(debts?.amount || 0).toLocaleString()} {debts?.currency || 'UZS'}</p>
                                </div>
                                <div className="debt-card">
                                    <h3>Кредитный лимит</h3>
                                    <p className="amount">{Number(debts?.creditLimit || 0).toLocaleString()} {debts?.currency || 'UZS'}</p>
                                </div>
                                <div className="debt-info">
                                    <p><strong>Просрочено:</strong> <span className="danger-text">{Number(debts?.overdueAmount || 0).toLocaleString()} {debts?.currency || 'UZS'}</span></p>
                                    <p><strong>Дата обновления:</strong> {debts?.updatedAt ? new Date(debts.updatedAt).toLocaleString() : 'Нет данных'}</p>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'certificates':
                return (
                    <div className="modal-list">
                        {certificates.length === 0 ? (
                            <div className="empty-state">Сертификатов нет</div>
                        ) : (
                            certificates.map(cert => (
                                <div key={cert.id} className="modal-list-item">
                                    <div className="item-info">
                                        <h4>{cert.name}</h4>
                                        <p>Срок действия: {cert.expiration_date}</p>
                                    </div>
                                    <button className="icon-btn" onClick={() => window.open(cert.file_url, '_blank')}>
                                        <FileCheck size={20} /> Скачать
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                );
            case 'catalog':
                return (
                    <div className="catalog-info">
                        <p>Перейдите в каталог для просмотра и заказа товаров</p>
                        <button className="btn-primary" onClick={() => navigate('/catalog')}>
                            Перейти в каталог
                        </button>
                    </div>
                );
            case 'promotions':
                return (
                    <div className="promo-list">
                        <div className="empty-state">
                            <p>Акции и специальные предложения будут доступны позже</p>
                        </div>
                    </div>
                );
            case 'cart':
                return (
                    <div className="cart-view">
                        <div className="modal-list">
                            {cart.items.length === 0 ? (
                                <div className="empty-state">Корзина пуста</div>
                            ) : (
                                cart.items.map((item) => (
                                    <div key={item.id} className="modal-list-item">
                                        <div className="item-info">
                                            <h4>{item.productName}</h4>
                                            <p>{item.quantity} шт. x {Number(item.price).toLocaleString()} сум</p>
                                        </div>
                                        <div className="item-total">{Number(item.total).toLocaleString()} сум</div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.items.length > 0 && (
                            <div className="cart-total">
                                <h3>Итого: {Number(cart.total).toLocaleString()} сум</h3>
                                <button className="checkout-btn" onClick={() => navigate('/cart')}>Оформить заказ</button>
                            </div>
                        )}
                    </div>
                );
            case 'claims':
                return (
                    <div className="claims-container">
                        <h3>Оформить претензию</h3>
                        <form className="claims-form" onSubmit={handleCreateClaim}>
                            <div className="form-group">
                                <label>Тип претензии</label>
                                <select name="type">
                                    <option value="shortage">Недовоз (Недовложение)</option>
                                    <option value="damage">Брак (Бой)</option>
                                    <option value="quality">Качество</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Номер накладной / Заказа</label>
                                <input name="orderId" type="text" placeholder="Введите номер" />
                            </div>
                            <div className="form-group">
                                <label>Описание проблемы</label>
                                <textarea name="description" rows="3" required></textarea>
                            </div>
                            <button type="submit" className="submit-claim-btn" disabled={loadingData}>Отправить претензию</button>
                        </form>

                        <h3>История претензий</h3>
                        <div className="modal-list">
                            {claims.length === 0 ? <p className="empty-state">Претензий нет</p> : claims.map(c => (
                                <div key={c.id} className="modal-list-item claim-item">
                                    <div>
                                        <h4>{c.type === 'shortage' ? 'Недовоз' : c.type === 'damage' ? 'Брак' : 'Претензия'}</h4>
                                        <p className="claim-desc">{c.description}</p>
                                        <small>{new Date(c.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <span className={`status-badge ${c.status === 'new' ? 'warning' : 'success'}`}>
                                        {c.status === 'new' ? 'На рассмотрении' : c.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getSectionTitle = () => {
        const titles = {
            orders: 'Мои заказы',
            documents: 'Документы',
            debts: 'Дебиторская задолженность',
            certificates: 'Сертификаты качества',
            catalog: 'Каталог товаров',
            promotions: 'Акции',
            cart: 'Корзина',
            claims: 'Оформление претензий'
        };
        return titles[activeSection] || '';
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            <Navbar />
            <main className="page-content">
                <section className="cabinet-header">
                    <div className="container">
                        <div className="cabinet-welcome">
                            <div className="cabinet-avatar">
                                <User size={40} />
                            </div>
                            <div>
                                <h1>Добро пожаловать, {profile.name}!</h1>
                                <p>{profile.company}</p>
                                <small style={{ opacity: 0.7, fontSize: '0.8em' }}>
                                    API: {import.meta.env.VITE_API_BASE_URL || 'Localhost (Default)'}
                                </small>
                            </div>
                            <button onClick={handleLogout} className="logout-btn">
                                <LogOut size={18} />
                                Выйти
                            </button>
                        </div>
                    </div>
                </section>

                <section className="dashboard-summary">
                    <div className="container">
                        <div className="summary-widgets">
                            <div className="summary-widget widget-debt" onClick={() => setActiveSection('debts')}>
                                <div className="widget-icon">
                                    <CreditCard size={24} />
                                </div>
                                <div className="widget-info">
                                    <span className="widget-label">Задолженность</span>
                                    <span className="widget-value">
                                        {debts ? `${Number(debts.amount || 0).toLocaleString()} ${debts.currency || 'UZS'}` : '—'}
                                    </span>
                                </div>
                                <TrendingUp size={18} className="widget-arrow" />
                            </div>

                            <div className="summary-widget widget-orders" onClick={() => setActiveSection('orders')}>
                                <div className="widget-icon">
                                    <Package size={24} />
                                </div>
                                <div className="widget-info">
                                    <span className="widget-label">Заказы</span>
                                    <span className="widget-value">{orders ? orders.length : 0} шт</span>
                                </div>
                                <BarChart3 size={18} className="widget-arrow" />
                            </div>

                            <div className="summary-widget widget-cart" onClick={() => navigate('/cart')}>
                                <div className="widget-icon">
                                    <ShoppingCart size={24} />
                                </div>
                                <div className="widget-info">
                                    <span className="widget-label">Корзина</span>
                                    <span className="widget-value">{cart ? cart.totalItems : 0} позиций</span>
                                </div>
                                <ChevronRight size={18} className="widget-arrow" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container">
                        <div className="cabinet-grid">
                            {/* Catalog */}
                            <div className="cabinet-card" onClick={() => navigate('/catalog')}>
                                <div className="cabinet-card-icon"><ShoppingBag size={32} /></div>
                                <h3>Каталог</h3>
                                <p>Поиск и заказ лекарственных средств</p>
                            </div>

                            {/* Cart */}
                            <div className="cabinet-card" onClick={() => setActiveSection('cart')}>
                                <div className="cabinet-card-icon"><ShoppingCart size={32} /></div>
                                <h3>Корзина</h3>
                                <p>Текущий заказ</p>
                            </div>

                            {/* Orders */}
                            <div className="cabinet-card" onClick={() => setActiveSection('orders')}>
                                <div className="cabinet-card-icon"><Package size={32} /></div>
                                <h3>Мои заказы</h3>
                                <p>История и статус заказов</p>
                            </div>

                            {/* Debts */}
                            <div className="cabinet-card" onClick={() => setActiveSection('debts')}>
                                <div className="cabinet-card-icon"><CreditCard size={32} /></div>
                                <h3>Задолженность</h3>
                                <p>Баланс и лимиты (1C)</p>
                            </div>

                            {/* Documents */}
                            <div className="cabinet-card" onClick={() => setActiveSection('documents')}>
                                <div className="cabinet-card-icon"><FileText size={32} /></div>
                                <h3>Документы</h3>
                                <p>Счета и накладные</p>
                            </div>

                            {/* Certificates */}
                            <div className="cabinet-card" onClick={() => setActiveSection('certificates')}>
                                <div className="cabinet-card-icon"><FileCheck size={32} /></div>
                                <h3>Сертификаты</h3>
                                <p>Скачать сертификаты качества</p>
                            </div>

                            {/* Promotions */}
                            <div className="cabinet-card" onClick={() => setActiveSection('promotions')}>
                                <div className="cabinet-card-icon"><Percent size={32} /></div>
                                <h3>Акции</h3>
                                <p>Специальные предложения</p>
                            </div>

                            {/* Claims */}
                            <div className="cabinet-card" onClick={() => setActiveSection('claims')}>
                                <div className="cabinet-card-icon"><AlertCircle size={32} /></div>
                                <h3>Претензии</h3>
                                <p>Оформить возврат или брак</p>
                            </div>

                            {/* Settings */}
                            <div
                                className="cabinet-card cabinet-card-active"
                                onClick={() => setShowSettings(true)}
                            >
                                <div className="cabinet-card-icon">
                                    <Settings size={32} />
                                </div>
                                <h3>Настройки</h3>
                                <p>Профиль и оформление</p>
                                <ChevronRight className="card-arrow" size={20} />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* General Section Modal */}
            {activeSection && (
                <div className="settings-overlay" onClick={() => setActiveSection(null)}>
                    <div className="settings-modal section-modal" onClick={e => e.stopPropagation()}>
                        <div className="settings-header">
                            <h2>{getSectionTitle()}</h2>
                            <button className="close-btn" onClick={() => setActiveSection(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="section-modal-content">
                            {renderSectionContent()}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="settings-overlay" onClick={() => setShowSettings(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="settings-header">
                            <h2>Настройки</h2>
                            <button className="close-btn" onClick={() => setShowSettings(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="settings-content">
                            <div className="settings-sidebar">
                                <button
                                    className={`settings-tab ${activeSettingsTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveSettingsTab('profile')}
                                >
                                    <User size={20} />
                                    <span>Профиль</span>
                                </button>
                                <button
                                    className={`settings-tab ${activeSettingsTab === 'theme' ? 'active' : ''}`}
                                    onClick={() => setActiveSettingsTab('theme')}
                                >
                                    <Palette size={20} />
                                    <span>Тема оформления</span>
                                </button>
                                <button
                                    className={`settings-tab ${activeSettingsTab === 'notifications' ? 'active' : ''}`}
                                    onClick={() => setActiveSettingsTab('notifications')}
                                >
                                    <Bell size={20} />
                                    <span>Уведомления</span>
                                </button>
                                <button
                                    className={`settings-tab ${activeSettingsTab === 'security' ? 'active' : ''}`}
                                    onClick={() => setActiveSettingsTab('security')}
                                >
                                    <Shield size={20} />
                                    <span>Безопасность</span>
                                </button>
                            </div>

                            <div className="settings-main">
                                {/* Profile Tab */}
                                {activeSettingsTab === 'profile' && (
                                    <div className="settings-section">
                                        <h3>Информация профиля</h3>
                                        <p className="settings-description">
                                            Обновите информацию о вашем профиле
                                        </p>

                                        <div className="profile-form">
                                            <div className="form-group">
                                                <label>
                                                    <User size={16} />
                                                    Имя
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => handleProfileChange('name', e.target.value)}
                                                    placeholder="Введите имя"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>
                                                    <Building size={16} />
                                                    Компания
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.company}
                                                    onChange={(e) => handleProfileChange('company', e.target.value)}
                                                    placeholder="Название компании"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>
                                                    <Mail size={16} />
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={profile.email}
                                                    onChange={(e) => handleProfileChange('email', e.target.value)}
                                                    placeholder="email@example.com"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>
                                                    <Phone size={16} />
                                                    Телефон
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={profile.phone}
                                                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                                                    placeholder="+998 (99) 123-45-67"
                                                />
                                            </div>

                                            <button className="save-btn">
                                                Сохранить изменения
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Theme Tab */}
                                {activeSettingsTab === 'theme' && (
                                    <div className="settings-section">
                                        <h3>Тема оформления</h3>
                                        <p className="settings-description">
                                            Выберите тему, которая вам больше нравится
                                        </p>

                                        <div className="theme-grid">
                                            {Object.entries(themes).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className={`theme-card ${theme === key ? 'active' : ''}`}
                                                    onClick={() => setTheme(key)}
                                                    style={{ '--theme-color': value.primary }}
                                                >
                                                    <div className="theme-preview" data-theme-preview={key}>
                                                        <div className="theme-preview-header"></div>
                                                        <div className="theme-preview-content">
                                                            <div className="theme-preview-sidebar"></div>
                                                            <div className="theme-preview-main"></div>
                                                        </div>
                                                    </div>
                                                    <div className="theme-info">
                                                        <span className="theme-icon">{value.icon}</span>
                                                        <span className="theme-name">{value.name}</span>
                                                        {theme === key && (
                                                            <Check size={18} className="theme-check" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notifications Tab */}
                                {activeSettingsTab === 'notifications' && (
                                    <div className="settings-section">
                                        <h3>Уведомления</h3>
                                        <p className="settings-description">
                                            Настройте, какие уведомления вы хотите получать
                                        </p>

                                        <div className="notification-options">
                                            <div className="notification-item">
                                                <div className="notification-info">
                                                    <h4>Email уведомления</h4>
                                                    <p>Получать уведомления на email</p>
                                                </div>
                                                <label className="toggle">
                                                    <input type="checkbox" defaultChecked />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>

                                            <div className="notification-item">
                                                <div className="notification-info">
                                                    <h4>Новости и акции</h4>
                                                    <p>Информация о скидках и новых товарах</p>
                                                </div>
                                                <label className="toggle">
                                                    <input type="checkbox" />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>

                                            <div className="notification-item">
                                                <div className="notification-info">
                                                    <h4>Статус заказа</h4>
                                                    <p>Уведомления об изменении статуса заказа</p>
                                                </div>
                                                <label className="toggle">
                                                    <input type="checkbox" defaultChecked />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Security Tab */}
                                {activeSettingsTab === 'security' && (
                                    <div className="settings-section">
                                        <h3>Безопасность</h3>
                                        <p className="settings-description">
                                            Управление паролем и безопасностью аккаунта
                                        </p>

                                        <div className="security-options">
                                            <div className="security-item">
                                                <div className="security-info">
                                                    <h4>Изменить пароль</h4>
                                                    <p>Рекомендуется менять пароль каждые 3 месяца</p>
                                                </div>
                                                <button className="security-btn">Изменить</button>
                                            </div>

                                            <div className="security-item">
                                                <div className="security-info">
                                                    <h4>Двухфакторная аутентификация</h4>
                                                    <p>Дополнительный уровень защиты аккаунта</p>
                                                </div>
                                                <span className="security-badge">Скоро</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CabinetPage;

