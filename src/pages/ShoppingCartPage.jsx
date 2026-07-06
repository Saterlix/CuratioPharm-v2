import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartAPI, ordersAPI } from '../services/api';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Package, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from './Navbar';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import './ShoppingCartPage.css';

const ShoppingCartPage = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    const [cart, setCart] = useState({ items: [], total: 0, totalItems: 0 });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const { addToast } = useToast();
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'normal' });
    
    const showConfirm = (title, message, onConfirm, type = 'normal') => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                onConfirm();
            },
            type
        });
    };
    
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadCart();
    }, [authLoading, isAuthenticated, navigate]);
    
    const loadCart = async () => {
        try {
            const data = await cartAPI.getCart();
            if (data.success) {
                setCart(data);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        
        setUpdating(true);
        try {
            await cartAPI.updateItemQuantity(itemId, newQuantity);
            loadCart();
        } catch (error) {
            console.error('Error updating quantity:', error);
        } finally {
            setUpdating(false);
        }
    };
    
    const handleRemoveItem = (itemId) => {
        showConfirm('Удалить товар', 'Вы действительно хотите удалить этот товар из корзины?', async () => {
            setUpdating(true);
            try {
                await cartAPI.removeItem(itemId);
                loadCart();
                addToast('Товар удален из корзины', 'info');
            } catch (error) {
                console.error('Error removing item:', error);
                addToast('Ошибка при удалении товара', 'error');
            } finally {
                setUpdating(false);
            }
        }, 'danger');
    };
    
    const handleClearCart = () => {
        showConfirm('Очистить корзину', 'Вы действительно хотите удалить все товары из корзины?', async () => {
            setUpdating(true);
            try {
                await cartAPI.clearCart();
                loadCart();
                addToast('Корзина очищена', 'info');
            } catch (error) {
                console.error('Error clearing cart:', error);
                addToast('Ошибка при очистке корзины', 'error');
            } finally {
                setUpdating(false);
            }
        }, 'danger');
    };
    
    const handleCreateOrder = async () => {
        if (cart.items.length === 0) {
            addToast('Корзина пуста', 'warning');
            return;
        }
        
        if (!deliveryAddress || !contactPhone) {
            addToast('Укажите адрес доставки и контактный телефон', 'warning');
            return;
        }
        
        setUpdating(true);
        try {
            const data = await ordersAPI.createOrder({
                deliveryAddress,
                contactPhone,
                notes
            });
            if (data.success) {
                setOrderSuccess(true);
                setOrderNumber(data.order.orderNumber);
                addToast('Заказ успешно оформлен!', 'success');
            } else {
                addToast(data.error || 'Ошибка при оформлении заказа', 'error');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            addToast('Ошибка при оформлении заказа', 'error');
        } finally {
            setUpdating(false);
        }
    };
    
    if (authLoading || loading) {
        return (
            <>
                <Navbar />
                <main className="page-content">
                    <div className="loading-container">
                        <Loader2 size={48} className="spin" />
                        <p>Загрузка корзины...</p>
                    </div>
                </main>
            </>
        );
    }
    
    if (orderSuccess) {
        return (
            <>
                <Navbar />
                <main className="page-content">
                    <section className="section">
                        <div className="container">
                            <div className="order-success">
                                <CheckCircle size={80} />
                                <h1>Заказ успешно оформлен!</h1>
                                <p>Номер заказа: <strong>{orderNumber}</strong></p>
                                <p>Мы свяжемся с вами для подтверждения заказа.</p>
                                <div className="success-actions">
                                    <button onClick={() => navigate('/orders')} className="btn-primary">
                                        Мои заказы
                                    </button>
                                    <button onClick={() => navigate('/catalog')} className="btn-secondary">
                                        Вернуться в каталог
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        );
    }
    
    return (
        <>
            <Navbar />
            <main className="page-content">
                <section className="cart-header">
                    <div className="container">
                        <button onClick={() => navigate('/catalog')} className="back-button">
                            <ArrowLeft size={18} />
                            Вернуться в каталог
                        </button>
                        <h1>Корзина</h1>
                        <p>Товаров в корзине: {cart.totalItems}</p>
                    </div>
                </section>
                
                <section className="section">
                    <div className="container">
                        {cart.items.length === 0 ? (
                            <div className="empty-cart">
                                <ShoppingCart size={64} />
                                <h3>Корзина пуста</h3>
                                <p>Добавьте товары из каталога</p>
                                <button onClick={() => navigate('/catalog')} className="btn-primary">
                                    Перейти в каталог
                                </button>
                            </div>
                        ) : (
                            <div className="cart-content">
                                <div className="cart-items">
                                    {cart.items.map(item => (
                                        <React.Fragment key={item.id}>
                                        <div className="cart-item">
                                            <div className="item-image">
                                                <Package size={40} />
                                            </div>
                                            <div className="item-info">
                                                <h3>{item.productName}</h3>
                                                <p className="item-price">{Number(item.price).toLocaleString()} сум</p>
                                            </div>
                                            <div className="item-quantity">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1 || updating}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    disabled={updating}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="item-total">
                                                <strong>{Number(item.total).toLocaleString()} сум</strong>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="remove-btn"
                                                disabled={updating}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        {item.quantity > (item.stock || 0) && (
                                            <div className="stock-warning-message" style={{
                                                backgroundColor: '#fef3c7', 
                                                color: '#d97706', 
                                                padding: '8px 12px', 
                                                borderRadius: '6px', 
                                                fontSize: '13px', 
                                                marginBottom: '16px',
                                                marginTop: '-8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                ⚠️ Запрошенное количество превышает остаток. Менеджер подтвердит наличие при обработке.
                                            </div>
                                        )}
                                        </React.Fragment>
                                    ))}
                                    
                                    {cart.items.length > 0 && (
                                        <button onClick={handleClearCart} className="clear-cart-btn" disabled={updating}>
                                            Очистить корзину
                                        </button>
                                    )}
                                </div>
                                
                                <div className="cart-sidebar">
                                    <div className="order-form">
                                        <h3>Оформление заказа</h3>
                                        
                                        <div className="form-group">
                                            <label>Адрес доставки *</label>
                                            <input
                                                type="text"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="Укажите адрес доставки"
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>Контактный телефон *</label>
                                            <input
                                                type="tel"
                                                value={contactPhone}
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                placeholder="+998 (99) 123-45-67"
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>Примечание</label>
                                            <textarea
                                                rows={3}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Дополнительная информация к заказу"
                                            />
                                        </div>
                                        
                                        <div className="order-summary">
                                            <div className="summary-row">
                                                <span>Товаров:</span>
                                                <span>{cart.totalItems} шт.</span>
                                            </div>
                                            <div className="summary-row total">
                                                <span>Итого:</span>
                                                <span>{Number(cart.total).toLocaleString()} сум</span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={handleCreateOrder}
                                            className="checkout-btn"
                                            disabled={updating || cart.items.length === 0}
                                        >
                                            {updating ? (
                                                <>
                                                    <Loader2 size={18} className="spin" />
                                                    Оформление...
                                                </>
                                            ) : (
                                                'Оформить заказ'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                type={confirmState.type}
            />
        </>
    );
};

export default ShoppingCartPage;
