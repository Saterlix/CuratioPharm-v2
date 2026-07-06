import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { Package, ArrowLeft, Eye, Loader2, Calendar, Package as PackageIcon, DollarSign } from 'lucide-react';
import Navbar from './Navbar';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadOrders();
    }, [authLoading, isAuthenticated, navigate]);
    
    const loadOrders = async () => {
        try {
            const data = await ordersAPI.getOrders();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleViewOrder = async (orderId) => {
        setLoadingDetails(true);
        try {
            const data = await ordersAPI.getOrderById(orderId);
            if (data.success) {
                setSelectedOrder(data.order);
            }
        } catch (error) {
            console.error('Error loading order details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };
    
    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { label: 'Ожидает обработки', className: 'pending' },
            processing: { label: 'В обработке', className: 'processing' },
            shipped: { label: 'Отправлен', className: 'shipped' },
            delivered: { label: 'Доставлен', className: 'delivered' },
            cancelled: { label: 'Отменен', className: 'cancelled' }
        };
        const statusInfo = statusMap[status] || { label: status, className: 'pending' };
        return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
    };
    
    if (authLoading || loading) {
        return (
            <>
                <Navbar />
                <main className="page-content">
                    <div className="loading-container">
                        <Loader2 size={48} className="spin" />
                        <p>Загрузка заказов...</p>
                    </div>
                </main>
            </>
        );
    }
    
    return (
        <>
            <Navbar />
            <main className="page-content">
                <section className="orders-header">
                    <div className="container">
                        <button onClick={() => navigate('/cabinet')} className="back-button">
                            <ArrowLeft size={18} />
                            Вернуться в кабинет
                        </button>
                        <h1>Мои заказы</h1>
                        <p>История всех ваших заказов</p>
                    </div>
                </section>
                
                <section className="section">
                    <div className="container">
                        {orders.length === 0 ? (
                            <div className="empty-orders">
                                <Package size={64} />
                                <h3>Заказы не найдены</h3>
                                <p>У вас пока нет заказов</p>
                                <button onClick={() => navigate('/catalog')} className="btn-primary">
                                    Перейти в каталог
                                </button>
                            </div>
                        ) : (
                            <div className="orders-content">
                                <div className="orders-list">
                                    {orders.map(order => (
                                        <div key={order.id} className="order-card">
                                            <div className="order-header">
                                                <div className="order-number">
                                                    <PackageIcon size={20} />
                                                    <span>{order.orderNumber}</span>
                                                </div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            
                                            <div className="order-info">
                                                <div className="info-item">
                                                    <Calendar size={16} />
                                                    <span>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                                                </div>
                                                <div className="info-item">
                                                    <DollarSign size={16} />
                                                    <span>{Number(order.totalAmount).toLocaleString()} сум</span>
                                                </div>
                                                <div className="info-item">
                                                    <Package size={16} />
                                                    <span>{order.itemsCount} позиций</span>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleViewOrder(order.id)}
                                                className="view-order-btn"
                                            >
                                                <Eye size={16} />
                                                Подробнее
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                {selectedOrder && (
                                    <div className="order-details-panel">
                                        <div className="details-header">
                                            <h2>Детали заказа</h2>
                                            <button onClick={() => setSelectedOrder(null)} className="close-btn">×</button>
                                        </div>
                                        
                                        {loadingDetails ? (
                                            <div className="loading-details">
                                                <Loader2 size={32} className="spin" />
                                                <p>Загрузка...</p>
                                            </div>
                                        ) : (
                                            <div className="details-content">
                                                <div className="order-meta">
                                                    <div className="meta-item">
                                                        <strong>Номер заказа:</strong>
                                                        <span>{selectedOrder.orderNumber}</span>
                                                    </div>
                                                    <div className="meta-item">
                                                        <strong>Статус:</strong>
                                                        {getStatusBadge(selectedOrder.status)}
                                                    </div>
                                                    <div className="meta-item">
                                                        <strong>Дата создания:</strong>
                                                        <span>{new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}</span>
                                                    </div>
                                                    <div className="meta-item">
                                                        <strong>Адрес доставки:</strong>
                                                        <span>{selectedOrder.deliveryAddress || 'Не указан'}</span>
                                                    </div>
                                                    <div className="meta-item">
                                                        <strong>Телефон:</strong>
                                                        <span>{selectedOrder.contactPhone || 'Не указан'}</span>
                                                    </div>
                                                    {selectedOrder.notes && (
                                                        <div className="meta-item">
                                                            <strong>Примечание:</strong>
                                                            <span>{selectedOrder.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="order-items-list">
                                                    <h3>Товары в заказе</h3>
                                                    {selectedOrder.items.map(item => (
                                                        <div key={item.id} className="order-item-detail">
                                                            <div className="item-name">{item.productName}</div>
                                                            <div className="item-quantity">{item.quantity} шт.</div>
                                                            <div className="item-price">{Number(item.price).toLocaleString()} сум</div>
                                                            <div className="item-total">{Number(item.total).toLocaleString()} сум</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className="order-total-summary">
                                                    <div className="summary-row">
                                                        <span>Всего позиций:</span>
                                                        <span>{selectedOrder.itemsCount}</span>
                                                    </div>
                                                    <div className="summary-row total">
                                                        <span>Итого:</span>
                                                                <span>{Number(selectedOrder.totalAmount).toLocaleString()} сум</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
};

export default OrderHistoryPage;
