import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { adminAPI } from '../services/api';
import {
    Users,
    UserPlus,
    LogOut,
    Search,
    Edit,
    Trash2,
    Check,
    X,
    Shield,
    BarChart3,
    Activity,
    RefreshCw,
    Eye,
    EyeOff,
    Loader2,
    Package,
    Plus,
    Tag,
    AlertCircle,
    LayoutGrid
} from 'lucide-react';
import Navbar from './Navbar';
import './AdminPage.css';

const AdminPage = () => {
    const { isAuthenticated, isAdmin, user, logout } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'catalog'
    
    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Messages
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Forms
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        companyName: '',
        contactPerson: '',
        phone: '',
        address: '',
        role: 'client' // client, manager, hr
    });

    const [productForm, setProductForm] = useState({
        name: '',
        manufacturer: '',
        price: '',
        stock: '',
        category: ''
    });

    // Permissions
    const canManageUsers = user?.role === 'admin' || user?.role === 'hr';
    const canManageCatalog = user?.role === 'admin' || user?.role === 'manager';

    // Check admin access
    useEffect(() => {
        if (!isAuthenticated || !isAdmin) {
            navigate('/login');
        } else {
            // Set initial tab based on permissions
            if (!canManageUsers && canManageCatalog) {
                setActiveTab('catalog');
            }
        }
    }, [isAuthenticated, isAdmin, navigate, canManageUsers, canManageCatalog]);

    // Load data
    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const promises = [adminAPI.getStats()];
            
            if (activeTab === 'users' && canManageUsers) {
                promises.push(adminAPI.getUsers());
            } else if (activeTab === 'catalog' && canManageCatalog) {
                promises.push(adminAPI.getProducts());
            }

            const results = await Promise.all(promises);
            setStats(results[0].stats);

            if (results[1]) {
                if (activeTab === 'users') setUsers(results[1].users || []);
                if (activeTab === 'catalog') setProducts(results[1].products || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // User Actions
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await adminAPI.createUser(newUser);
            setSuccessMessage('Пользователь успешно создан!');
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', companyName: '', contactPerson: '', phone: '', address: '', role: 'client' });
            loadData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleUserActive = async (userId, currentState) => {
        try {
            await adminAPI.updateUser(userId, { isActive: !currentState });
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Вы уверены, что хотите деактивировать этого пользователя?')) {
            try {
                await adminAPI.deleteUser(userId);
                loadData();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    // Product Actions
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingProduct) {
                await adminAPI.updateProduct(editingProduct.id, productForm);
                setSuccessMessage('Товар обновлен');
            } else {
                await adminAPI.createProduct(productForm);
                setSuccessMessage('Товар добавлен');
            }
            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm({ name: '', manufacturer: '', price: '', stock: '', category: '' });
            loadData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const openProductModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setProductForm({
                name: product.name,
                manufacturer: product.manufacturer,
                price: product.price,
                stock: product.stock,
                category: product.category
            });
        } else {
            setEditingProduct(null);
            setProductForm({ name: '', manufacturer: '', price: '', stock: '', category: '' });
        }
        setShowProductModal(true);
    };

    const handleToggleProductActive = async (productId, currentState) => {
        try {
            await adminAPI.updateProduct(productId, { isActive: !currentState });
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Filtering
    const filteredUsers = users.filter(u =>
        u.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredProducts = products.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch(role) {
            case 'admin':
                return (
                    <span className="role-badge admin">
                        <Shield size={14} /> Администратор
                    </span>
                );
            case 'manager':
                return (
                    <span className="role-badge manager">
                        <LayoutGrid size={14} /> Менеджер
                    </span>
                );
            case 'hr':
                return (
                    <span className="role-badge partner">
                        <Users size={14} /> HR
                    </span>
                );
            case 'partner':
                return (
                    <span className="role-badge partner">
                        <Users size={14} /> Партнер
                    </span>
                );
            default:
                return (
                    <span className="role-badge client">
                        <Users size={14} /> Клиент
                    </span>
                );
        }
    };

    if (!isAdmin) return null;

    return (
        <div data-theme={theme?.name || 'default'}>
            <Navbar />
            <main className="page-content admin-page">
                {/* Admin Header */}
                <section className="admin-header">
                    <div className="container">
                        <div className="admin-header-content">
                            <div className="admin-title">
                                <Shield size={32} />
                                <div>
                                    <h1>Панель управления</h1>
                                    <p>
                                        {user?.role === 'admin' && 'Полный доступ'}
                                        {user?.role === 'manager' && 'Управление контентом'}
                                        {user?.role === 'hr' && 'Управление пользователями'}
                                    </p>
                                </div>
                            </div>
                            <div className="admin-header-actions">
                                <div className="admin-user-info">
                                    <span className="admin-email">{user?.email}</span>
                                    <span className="admin-role-chip">
                                        {user?.role === 'admin' && 'Администратор'}
                                        {user?.role === 'manager' && 'Менеджер'}
                                        {user?.role === 'hr' && 'HR'}
                                        {user?.role === 'partner' && 'Партнер'}
                                    </span>
                                </div>
                                <button onClick={handleLogout} className="admin-logout-btn">
                                    <LogOut size={18} />
                                    Выйти
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Cards */}
                {stats && (
                    <section className="admin-stats">
                        <div className="container">
                            <div className="stats-cards">
                                <div className="stat-card">
                                    <Users size={24} />
                                    <div>
                                        <span className="stat-value">{stats.totalPartners}</span>
                                        <span className="stat-label">Клиентов</span>
                                    </div>
                                </div>
                                <div className="stat-card active">
                                    <Package size={24} />
                                    <div>
                                        <span className="stat-value">{stats.totalProducts}</span>
                                        <span className="stat-label">Товаров</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Main Content Area */}
                <section className="admin-content">
                    <div className="container">
                        {/* Messages */}
                        {error && <div className="admin-error">{error}</div>}
                        {successMessage && <div className="admin-success">{successMessage}</div>}

                        {/* Tabs */}
                        <div className="admin-tabs">
                            {canManageUsers && (
                                <button 
                                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('users')}
                                >
                                    <Users size={18} />
                                    Пользователи
                                </button>
                            )}
                            {canManageCatalog && (
                                <button 
                                    className={`admin-tab ${activeTab === 'catalog' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('catalog')}
                                >
                                    <LayoutGrid size={18} />
                                    Каталог
                                </button>
                            )}
                        </div>

                        {/* Toolbar */}
                        <div className="admin-toolbar">
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'users' ? "Поиск пользователей..." : "Поиск товаров..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button onClick={loadData} className="refresh-btn" title="Обновить">
                                <RefreshCw size={18} />
                            </button>
                            
                            {activeTab === 'users' && canManageUsers && (
                                <button onClick={() => setShowCreateModal(true)} className="create-btn">
                                    <UserPlus size={18} />
                                    Добавить пользователя
                                </button>
                            )}

                            {activeTab === 'catalog' && canManageCatalog && (
                                <button onClick={() => openProductModal()} className="create-btn">
                                    <Plus size={18} />
                                    Добавить товар
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="loading-state">
                                <Loader2 size={48} className="spin" />
                                <p>Загрузка данных...</p>
                            </div>
                        ) : (
                            <div className="admin-table-wrapper">
                                {activeTab === 'users' && canManageUsers && (
                                    <table className="users-table">
                                        <thead>
                                            <tr>
                                                <th>Роль</th>
                                                <th>Компания / Имя</th>
                                                <th>Email</th>
                                                <th>Контакты</th>
                                                <th>Статус</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr><td colSpan="6" className="empty-state">Пользователи не найдены</td></tr>
                                            ) : (
                                                filteredUsers.map(u => (
                                                    <tr key={u.id}>
                                                        <td>{getRoleBadge(u.role)}</td>
                                                        <td>
                                                            <div className="user-name">{u.companyName}</div>
                                                            {u.contactPerson && <div className="user-sub">{u.contactPerson}</div>}
                                                        </td>
                                                        <td>{u.email}</td>
                                                        <td>{u.phone || '-'}</td>
                                                        <td>
                                                            <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                                                {u.isActive ? 'Активен' : 'Отключен'}
                                                            </span>
                                                        </td>
                                                        <td className="actions-cell">
                                                            <button
                                                                onClick={() => handleToggleUserActive(u.id, u.isActive)}
                                                                className={`action-btn ${u.isActive ? 'deactivate' : 'activate'}`}
                                                                title={u.isActive ? 'Отключить' : 'Включить'}
                                                            >
                                                                {u.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="action-btn delete"
                                                                title="Удалить"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'catalog' && canManageCatalog && (
                                    <table className="users-table">
                                        <thead>
                                            <tr>
                                                <th>Наименование</th>
                                                <th>Категория</th>
                                                <th>Производитель</th>
                                                <th>Цена</th>
                                                <th>Остаток</th>
                                                <th>Статус</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.length === 0 ? (
                                                <tr><td colSpan="7" className="empty-state">Товары не найдены</td></tr>
                                            ) : (
                                                filteredProducts.map(p => (
                                                    <tr key={p.id}>
                                                        <td className="company-cell">{p.name}</td>
                                                        <td><span className="category-tag">{p.category}</span></td>
                                                        <td>{p.manufacturer}</td>
                                                        <td>{Number(p.price).toLocaleString()} сум</td>
                                                        <td>{p.stock}</td>
                                                        <td>
                                                            <span className={`status-badge ${p.isActive ? 'active' : 'inactive'}`}>
                                                                {p.isActive ? 'В продаже' : 'Скрыт'}
                                                            </span>
                                                        </td>
                                                        <td className="actions-cell">
                                                            <button
                                                                onClick={() => openProductModal(p)}
                                                                className="action-btn edit"
                                                                title="Редактировать"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleProductActive(p.id, p.isActive)}
                                                                className={`action-btn ${p.isActive ? 'deactivate' : 'activate'}`}
                                                                title={p.isActive ? 'Скрыть' : 'Показать'}
                                                            >
                                                                {p.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Create User Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Новый пользователь</h3>
                                <button onClick={() => setShowCreateModal(false)} className="close-btn"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="modal-form">
                                <div className="form-group">
                                    <label>Роль доступа *</label>
                                    <select 
                                        value={newUser.role} 
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                        className="role-select"
                                    >
                                        <option value="client">Клиент (Аптека/Дистрибьютор)</option>
                                        <option value="manager">Менеджер (Управление каталогом)</option>
                                        <option value="hr">HR (Управление персоналом)</option>
                                        <option value="admin">Администратор (Полный доступ)</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Пароль *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="Пароль"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Название / Имя *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.companyName}
                                        onChange={e => setNewUser({ ...newUser, companyName: e.target.value })}
                                        placeholder="Название компании или Имя"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Контактное лицо</label>
                                        <input
                                            type="text"
                                            value={newUser.contactPerson}
                                            onChange={e => setNewUser({ ...newUser, contactPerson: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Телефон</label>
                                        <input
                                            type="tel"
                                            value={newUser.phone}
                                            onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">Отмена</button>
                                    <button type="submit" className="btn-create"><UserPlus size={18} /> Создать</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Product Modal */}
                {showProductModal && (
                    <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h3>
                                <button onClick={() => setShowProductModal(false)} className="close-btn"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveProduct} className="modal-form">
                                <div className="form-group">
                                    <label>Наименование *</label>
                                    <input
                                        type="text"
                                        required
                                        value={productForm.name}
                                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                        placeholder="Название препарата"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Категория</label>
                                        <input
                                            type="text"
                                            value={productForm.category}
                                            onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                                            placeholder="Например: Антибиотики"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Производитель</label>
                                        <input
                                            type="text"
                                            value={productForm.manufacturer}
                                            onChange={e => setProductForm({ ...productForm, manufacturer: e.target.value })}
                                            placeholder="Завод изготовитель"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Цена (сум) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={productForm.price}
                                            onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Остаток *</label>
                                        <input
                                            type="number"
                                            required
                                            value={productForm.stock}
                                            onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowProductModal(false)} className="btn-cancel">Отмена</button>
                                    <button type="submit" className="btn-create"><Check size={18} /> Сохранить</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;