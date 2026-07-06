import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { devAPI } from '../services/api';
import {
    Terminal,
    Activity,
    FileText,
    Calendar,
    Users,
    ArrowLeft,
    RefreshCw,
    TrendingUp,
    MessageSquare,
    KeyRound,
    AlertTriangle,
    Eye,
    Plus,
    X,
    Trash2,
    CalendarDays,
    Check,
    Loader2
} from 'lucide-react';
import Navbar from './Navbar';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import './DevPanelPage.css';

const DevPanelPage = () => {
    const { isAuthenticated, isDeveloper, loading: authLoading } = useAuth();
    const navigate = useNavigate();
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

    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'logs', 'events', 'users'
    const [loading, setLoading] = useState(true);
    
    // Data states
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [events, setEvents] = useState([]);
    const [usersFull, setUsersFull] = useState([]);
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Search terms
    const [logSearch, setLogSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');

    // Event form modal states
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        type: 'ribbon', // 'ribbon', 'banner', 'popup'
        background_color: '#10b981',
        text_color: '#ffffff',
        link_url: '',
        starts_at: new Date().toISOString().substring(0, 16),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
    });

    // Guard developer routing
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !isDeveloper) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, isDeveloper, navigate]);

    // Load tab-specific data
    useEffect(() => {
        if (isDeveloper) {
            loadTabData();
        }
    }, [isDeveloper, activeTab]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    const loadTabData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'dashboard') {
                const response = await devAPI.getStats();
                setStats(response.data || response);
            } else if (activeTab === 'logs') {
                const response = await devAPI.getLogs();
                setLogs(response.data || response);
            } else if (activeTab === 'events') {
                const response = await devAPI.getEvents();
                setEvents(response.data || response);
            } else if (activeTab === 'users') {
                const response = await devAPI.getUsersFull();
                setUsersFull(response.data || response);
            }
        } catch (err) {
            setError(err.message || 'Ошибка загрузки данных разработчика');
        } finally {
            setLoading(false);
        }
    };

    // Event management logic
    const handleSaveEvent = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                ...eventForm,
                starts_at: new Date(eventForm.starts_at).toISOString(),
                ends_at: new Date(eventForm.ends_at).toISOString()
            };

            if (editingEvent) {
                await devAPI.updateEvent(editingEvent.id, payload);
                setSuccessMessage('Событие успешно обновлено');
            } else {
                await devAPI.createEvent(payload);
                setSuccessMessage('Событие успешно создано');
            }
            setShowEventModal(false);
            setEditingEvent(null);
            resetEventForm();
            loadTabData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message || 'Не удалось сохранить событие');
        }
    };

    const handleDeleteEvent = (eventId) => {
        showConfirm('Удаление события', 'Удалить это событие навсегда?', async () => {
            try {
                await devAPI.deleteEvent(eventId);
                addToast('Событие удалено', 'success');
                loadTabData();
            } catch (err) {
                addToast(err.message || 'Не удалось удалить событие', 'error');
            }
        }, 'danger');
    };

    const openEventModal = (eventObj = null) => {
        if (eventObj) {
            setEditingEvent(eventObj);
            setEventForm({
                title: eventObj.title || '',
                description: eventObj.description || '',
                type: eventObj.type || 'ribbon',
                background_color: eventObj.background_color || '#10b981',
                text_color: eventObj.text_color || '#ffffff',
                link_url: eventObj.link_url || '',
                starts_at: new Date(eventObj.starts_at).toISOString().substring(0, 16),
                ends_at: new Date(eventObj.ends_at).toISOString().substring(0, 16)
            });
        } else {
            setEditingEvent(null);
            resetEventForm();
        }
        setShowEventModal(true);
    };

    const resetEventForm = () => {
        setEventForm({
            title: '',
            description: '',
            type: 'ribbon',
            background_color: '#10b981',
            text_color: '#ffffff',
            link_url: '',
            starts_at: new Date().toISOString().substring(0, 16),
            ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
        });
    };

    // Filter helpers
    const filteredLogs = logs.filter(log =>
        log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.details?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.admin_name?.toLowerCase().includes(logSearch.toLowerCase()) ||
        (log.target_name && log.target_name?.toLowerCase().includes(logSearch.toLowerCase()))
    );

    const filteredUsers = usersFull.filter(u =>
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.company_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.contact_person?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role?.toLowerCase().includes(userSearch.toLowerCase())
    );

    if (!isDeveloper) return null;

    return (
        <>
            <Navbar />
            <main className="page-content dev-page-wrapper">
                {/* Dev Panel Header */}
                <section className="dev-header">
                    <div className="container">
                        <div className="dev-header-content">
                            <div className="dev-title-block">
                                <Terminal className="terminal-icon" size={28} />
                                <div>
                                    <h1>Консоль разработчика</h1>
                                    <p className="system-indicator">
                                        System Online • Environment: <span className="env-tag">Development (Test Mode)</span>
                                    </p>
                                </div>
                            </div>
                            <div className="dev-header-actions">
                                <button onClick={() => navigate('/cp-admin-panel')} className="admin-back-btn">
                                    <ArrowLeft size={16} />
                                    В админку
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="container dev-main-layout">
                    {/* Dev Navigation Sidebar */}
                    <aside className="dev-sidebar">
                        <button 
                            className={`dev-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <Activity size={18} />
                            Мониторинг
                        </button>
                        <button 
                            className={`dev-nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            <FileText size={18} />
                            Логи действий
                        </button>
                        <button 
                            className={`dev-nav-btn ${activeTab === 'events' ? 'active' : ''}`}
                            onClick={() => setActiveTab('events')}
                        >
                            <Calendar size={18} />
                            Баннеры & События
                        </button>
                        <button 
                            className={`dev-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <Users size={18} />
                            База пользователей
                        </button>
                        
                        <div className="dev-system-specs">
                            <div className="spec-title">БД (In-Memory RAM)</div>
                            <div className="spec-progress-bar"><div className="spec-progress-fill" style={{ width: '15%' }}></div></div>
                            <div className="spec-meta">Используется: ~2.4 MB</div>
                        </div>
                    </aside>

                    {/* Dev Main Content Panel */}
                    <div className="dev-content-panel">
                        {error && <div className="dev-error-alert"><AlertTriangle size={18} /> {error}</div>}
                        {successMessage && <div className="dev-success-alert"><Check size={18} /> {successMessage}</div>}

                        {loading ? (
                            <div className="dev-loading-spinner">
                                <Loader2 className="spin" size={40} />
                                <p>Синхронизация системных данных...</p>
                            </div>
                        ) : (
                            <>
                                {/* TAB 1: DASHBOARD MONITORING */}
                                {activeTab === 'dashboard' && stats && (
                                    <div className="dev-dashboard-grid">
                                        <div className="dev-card stat-summary-card">
                                            <div className="card-header">
                                                <h3>Суммарная аналитика</h3>
                                                <RefreshCw onClick={loadTabData} className="refresh-icon-btn" size={16} />
                                            </div>
                                            <div className="stat-boxes">
                                                <div className="stat-box">
                                                    <span className="label">Всего заказов</span>
                                                    <span className="value text-emerald">{stats.orders?.total || 0}</span>
                                                    <span className="subtext">Выручка: {(stats.revenue || 0).toLocaleString()} сум</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="label">Всего чатов</span>
                                                    <span className="value text-teal">{stats.chats?.total || 0}</span>
                                                    <span className="subtext">Активных чатов: {stats.chats?.active || 0}</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="label">Генерации OTP</span>
                                                    <span className="value text-orange">{stats.otp?.total || 0}</span>
                                                    <span className="subtext">Не использовано: {stats.otp?.unused || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="dev-card user-breakdown-card">
                                            <h3>Пользователи по ролям</h3>
                                            <div className="role-bars">
                                                <div className="role-bar-item">
                                                    <span className="role-label">Clients</span>
                                                    <div className="progress-track"><div className="progress-bar" style={{ width: `${(stats.users?.clients / stats.users?.total) * 100}%` }}></div></div>
                                                    <span className="role-count">{stats.users?.clients || 0}</span>
                                                </div>
                                                <div className="role-bar-item">
                                                    <span className="role-label">Admins</span>
                                                    <div className="progress-track"><div className="progress-bar bg-blue" style={{ width: `${(stats.users?.admins / stats.users?.total) * 100}%` }}></div></div>
                                                    <span className="role-count">{stats.users?.admins || 0}</span>
                                                </div>
                                                <div className="role-bar-item">
                                                    <span className="role-label">Всего</span>
                                                    <div className="progress-track"><div className="progress-bar bg-green" style={{ width: '100%' }}></div></div>
                                                    <span className="role-count">{stats.users?.total || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="dev-card products-stats-card">
                                            <h3>Каталог</h3>
                                            <div className="catalog-meta">
                                                <div className="meta-item">
                                                    <span className="meta-num">{stats.products?.total || 0}</span>
                                                    <span className="meta-lbl">Товаров в системе</span>
                                                </div>
                                                <div className="meta-item">
                                                    <span className="meta-num text-emerald">{stats.products?.active || 0}</span>
                                                    <span className="meta-lbl">Активных товаров</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: AUDIT LOGS */}
                                {activeTab === 'logs' && (
                                    <div className="dev-card log-viewer-card">
                                        <div className="card-header flex-header">
                                            <h3>Журнал системного аудита ({filteredLogs.length})</h3>
                                            <div className="dev-filter-input">
                                                <input 
                                                    type="text" 
                                                    placeholder="Фильтр логов..." 
                                                    value={logSearch}
                                                    onChange={e => setLogSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="logs-table-wrapper">
                                            <table className="dev-table">
                                                <thead>
                                                    <tr>
                                                        <th>Timestamp</th>
                                                        <th>Администратор</th>
                                                        <th>Действие</th>
                                                        <th>Target ID</th>
                                                        <th>Детали</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredLogs.length === 0 ? (
                                                        <tr><td colSpan="5" className="text-center">Логи отсутствуют или не найдены</td></tr>
                                                    ) : (
                                                        filteredLogs.map(log => (
                                                            <tr key={log.id}>
                                                                <td className="time-col">{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                                                                <td><span className="admin-name-tag">{log.admin_name}</span></td>
                                                                <td><span className="action-tag">{log.action}</span></td>
                                                                <td>{log.target_user_id || '-'}</td>
                                                                <td className="details-col">{log.details}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: PROMO EVENTS */}
                                {activeTab === 'events' && (
                                    <div className="dev-card events-dev-card">
                                        <div className="card-header flex-header">
                                            <h3>Управление баннерами и уведомлениями ({events.length})</h3>
                                            <button onClick={() => openEventModal()} className="dev-add-btn">
                                                <Plus size={16} /> Создать уведомление
                                            </button>
                                        </div>

                                        <div className="events-grid-panel">
                                            {events.length === 0 ? (
                                                <p className="no-events-text text-center">Созданных объявлений или событий пока нет.</p>
                                            ) : (
                                                events.map(ev => (
                                                    <div key={ev.id} className="dev-event-card" style={{ borderLeftColor: ev.background_color }}>
                                                        <div className="event-card-header">
                                                            <span className={`event-type-badge ${ev.type}`}>{ev.type}</span>
                                                            <div className="event-card-actions">
                                                                <button onClick={() => openEventModal(ev)} className="card-icon-btn text-blue" title="Редактировать">
                                                                    <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                                                                </button>
                                                                <button onClick={() => handleDeleteEvent(ev.id)} className="card-icon-btn text-red" title="Удалить">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <h4>{ev.title}</h4>
                                                        <p className="desc">{ev.description}</p>
                                                        <div className="event-card-details">
                                                            <div><strong>Срок:</strong> {new Date(ev.starts_at).toLocaleDateString()} - {new Date(ev.ends_at).toLocaleDateString()}</div>
                                                            <div><strong>Статус:</strong> <span className={ev.is_active ? 'active-event' : 'inactive-event'}>{ev.is_active ? 'Активно' : 'Архив'}</span></div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: USERS DATABASE */}
                                {activeTab === 'users' && (
                                    <div className="dev-card users-dev-card">
                                        <div className="card-header flex-header">
                                            <h3>База учетных записей ({filteredUsers.length})</h3>
                                            <div className="dev-filter-input">
                                                <input 
                                                    type="text" 
                                                    placeholder="Поиск по email/компании..." 
                                                    value={userSearch}
                                                    onChange={e => setUserSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="logs-table-wrapper">
                                            <table className="dev-table">
                                                <thead>
                                                    <tr>
                                                        <th>Роль</th>
                                                        <th>Компания / Клиент</th>
                                                        <th>Email / Логин</th>
                                                        <th>Телефон</th>
                                                        <th>Заказов</th>
                                                        <th>Смена пароля</th>
                                                        <th>Статус</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.length === 0 ? (
                                                        <tr><td colSpan="7" className="text-center">Пользователи не найдены</td></tr>
                                                    ) : (
                                                        filteredUsers.map(u => (
                                                            <tr key={u.id}>
                                                                <td>
                                                                    <span className={`dev-role-badge ${u.role}`}>
                                                                        {u.role}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div className="comp-name">{u.company_name}</div>
                                                                    <div className="comp-person">{u.contact_person}</div>
                                                                </td>
                                                                <td>{u.email}</td>
                                                                <td>{u.phone}</td>
                                                                <td><span className="orders-badge">{u.orders_count || 0}</span></td>
                                                                <td>
                                                                    <span className={`pass-badge ${u.must_change_password ? 'must' : 'ok'}`}>
                                                                        {u.must_change_password ? 'Требуется' : 'ОК'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                                                        {u.is_active ? 'Активен' : 'Отключен'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* EVENT FORM MODAL */}
                {showEventModal && (
                    <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                        <div className="modal dev-event-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingEvent ? 'Редактировать событие' : 'Создать объявление'}</h3>
                                <button onClick={() => setShowEventModal(false)} className="close-btn"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveEvent} className="modal-form">
                                <div className="form-group">
                                    <label>Заголовок события *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={eventForm.title} 
                                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                        placeholder="Скидка 15% на Амоксициллин!"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Описание / Текст анонса *</label>
                                    <textarea 
                                        required 
                                        rows="3"
                                        value={eventForm.description} 
                                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                        placeholder="Подробное описание предложения или события для пользователей..."
                                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Тип показа</label>
                                        <select 
                                            value={eventForm.type}
                                            onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                        >
                                            <option value="ribbon">Бегущая лента (Ribbon)</option>
                                            <option value="banner">Верхний баннер (Banner)</option>
                                            <option value="popup">Всплывающее окно (Popup)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ссылка (link_url)</label>
                                        <input 
                                            type="text" 
                                            value={eventForm.link_url} 
                                            onChange={e => setEventForm({ ...eventForm, link_url: e.target.value })}
                                            placeholder="/catalog или внешняя ссылка"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Цвет фона</label>
                                        <input 
                                            type="color" 
                                            value={eventForm.background_color} 
                                            onChange={e => setEventForm({ ...eventForm, background_color: e.target.value })}
                                            style={{ height: '45px', padding: '2px', cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Цвет текста</label>
                                        <input 
                                            type="color" 
                                            value={eventForm.text_color} 
                                            onChange={e => setEventForm({ ...eventForm, text_color: e.target.value })}
                                            style={{ height: '45px', padding: '2px', cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Начало показа *</label>
                                        <input 
                                            type="datetime-local" 
                                            required
                                            value={eventForm.starts_at} 
                                            onChange={e => setEventForm({ ...eventForm, starts_at: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Окончание показа *</label>
                                        <input 
                                            type="datetime-local" 
                                            required
                                            value={eventForm.ends_at} 
                                            onChange={e => setEventForm({ ...eventForm, ends_at: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowEventModal(false)} className="btn-cancel">Отмена</button>
                                    <button type="submit" className="btn-create">Сохранить</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
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

export default DevPanelPage;
