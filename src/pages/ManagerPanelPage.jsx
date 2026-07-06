import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { adminAPI } from '../services/api';
import { canManageOrders } from '../utils/roles';
import {
    Package,
    Search,
    LogOut,
    Loader2,
    Check,
    X,
    Clock,
    Filter,
    RefreshCw,
    User,
    TrendingUp,
    ShoppingBag,
    Eye
} from 'lucide-react';
import Navbar from './Navbar';
import './ManagerPanelPage.css';

const ManagerPanelPage = () => {
    const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Auth guard
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user && !canManageOrders(user.role)) {
            navigate('/cabinet');
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    // Load orders
    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getOrders();
            setOrders(data.orders || data || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            loadOrders();
        }
    }, [isAuthenticated, user, loadOrders]);

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            await adminAPI.updateOrderStatus(orderId, status);
            setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Filters
    const filteredOrders = orders.filter(o => {
        const matchesSearch = !searchTerm ||
            (o.order_number || o.id || '').toString().includes(searchTerm) ||
            (o.user?.Email || o.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user?.FullName || o.user?.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = orders.filter(o => o.status === 'Pending').length;
    const processingCount = orders.filter(o => o.status === 'Processing').length;
    const completedCount = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;

    const getStatusLabel = (status) => {
        const map = {
            'Pending': 'Ожидает',
            'Processing': 'В обработке',
            'Shipped': 'Отправлен',
            'Delivered': 'Доставлен',
            'Completed': 'Выполнен',
            'Cancelled': 'Отменён'
        };
        return map[status] || status;
    };

    if (authLoading) {
        return (
            <div className="mp-loading">
                <Loader2 className="mp-spinner" size={40} />
                <span>Загрузка...</span>
            </div>
        );
    }

    return (
        <div className="mp-page" data-theme={theme?.name || 'default'}>
            <Navbar />
            <div className="mp-container">
                {/* Sidebar */}
                <aside className="mp-sidebar">
                    <div className="mp-sidebar-header">
                        <div className="mp-user-info">
                            <div className="mp-avatar">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h3>Менеджер Продаж</h3>
                                <span className="mp-user-email">{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mp-stats">
                        <div className="mp-stat-card mp-stat-pending">
                            <Clock size={18} />
                            <div>
                                <span className="mp-stat-number">{pendingCount}</span>
                                <span className="mp-stat-label">Ожидают</span>
                            </div>
                        </div>
                        <div className="mp-stat-card mp-stat-processing">
                            <TrendingUp size={18} />
                            <div>
                                <span className="mp-stat-number">{processingCount}</span>
                                <span className="mp-stat-label">В работе</span>
                            </div>
                        </div>
                        <div className="mp-stat-card mp-stat-completed">
                            <Check size={18} />
                            <div>
                                <span className="mp-stat-number">{completedCount}</span>
                                <span className="mp-stat-label">Выполнено</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="mp-nav">
                        <button className="mp-nav-btn active">
                            <Package size={18} />
                            Заказы
                        </button>
                    </nav>

                    <div className="mp-sidebar-footer">
                        <button className="mp-logout-btn" onClick={handleLogout}>
                            <LogOut size={18} />
                            Выйти
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="mp-main">
                    {/* Header */}
                    <div className="mp-header">
                        <h2>Управление заказами</h2>
                        <div className="mp-header-right">
                            <button className="mp-refresh-btn" onClick={loadOrders} title="Обновить">
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mp-filters">
                        <div className="mp-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Поиск по номеру, клиенту..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="mp-filter-tabs">
                            {[
                                { key: 'all', label: `Все (${orders.length})` },
                                { key: 'Pending', label: `Ожидают (${pendingCount})` },
                                { key: 'Processing', label: `В работе (${processingCount})` },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    className={statusFilter === f.key ? 'active' : ''}
                                    onClick={() => setStatusFilter(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Orders table */}
                    <div className="mp-content">
                        {loading ? (
                            <div className="mp-loading-inline">
                                <Loader2 className="mp-spinner" size={24} />
                                Загрузка заказов...
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="mp-empty">
                                <Package size={48} />
                                <h3>Нет заказов</h3>
                                <p>Заказы появятся здесь</p>
                            </div>
                        ) : (
                            <div className="mp-orders-grid">
                                {filteredOrders.map(order => (
                                    <div key={order.id} className="mp-order-card">
                                        <div className="mp-order-header">
                                            <span className="mp-order-number">
                                                #{order.order_number || order.id}
                                            </span>
                                            <span className={`mp-order-status ${(order.status || '').toLowerCase()}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>

                                        <div className="mp-order-info">
                                            <div className="mp-order-row">
                                                <User size={14} />
                                                <span>{order.user?.FullName || order.user?.contactPerson || order.user?.Email || 'Неизвестно'}</span>
                                            </div>
                                            <div className="mp-order-row">
                                                <Clock size={14} />
                                                <span>{new Date(order.created_at || order.CreatedAt || Date.now()).toLocaleString('ru-RU')}</span>
                                            </div>
                                            <div className="mp-order-total">
                                                {Number(order.total_amount || order.TotalAmount || 0).toLocaleString()} UZS
                                            </div>
                                        </div>

                                        <div className="mp-order-actions">
                                            {order.status === 'Pending' && (
                                                <>
                                                    <button
                                                        className="mp-action-btn mp-accept"
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'Processing')}
                                                    >
                                                        <Check size={14} /> Принять
                                                    </button>
                                                    <button
                                                        className="mp-action-btn mp-reject"
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                                                    >
                                                        <X size={14} /> Отклонить
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'Processing' && (
                                                <button
                                                    className="mp-action-btn mp-ship"
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                                                >
                                                    <Package size={14} /> Отправить
                                                </button>
                                            )}
                                            {order.status === 'Shipped' && (
                                                <button
                                                    className="mp-action-btn mp-complete"
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                                                >
                                                    <Check size={14} /> Доставлен
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="mp-modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="mp-modal" onClick={e => e.stopPropagation()}>
                        <h3>Заказ #{selectedOrder.order_number || selectedOrder.id}</h3>
                        <button className="mp-modal-close" onClick={() => setSelectedOrder(null)}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerPanelPage;
