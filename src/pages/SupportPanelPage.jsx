import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { adminAPI } from '../services/api';
import { canViewSupportTickets } from '../utils/roles';
import {
    MessageSquare,
    Users,
    Search,
    Send,
    LogOut,
    Loader2,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    RefreshCw,
    User,
    Mail,
    Phone,
    Filter,
    XCircle,
    MessageCircle
} from 'lucide-react';
import Navbar from './Navbar';
import './SupportPanelPage.css';

const SupportPanelPage = () => {
    const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('chats');
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingReply, setSendingReply] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Auth guard
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user && !canViewSupportTickets(user.role)) {
            navigate('/cabinet');
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    // Load chats
    const loadChats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getChats();
            setChats(data.chats || data || []);
        } catch (err) {
            console.error('Failed to load chats:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            loadChats();
        }
    }, [isAuthenticated, user, loadChats]);

    // Load chat messages
    const openChat = async (chat) => {
        setSelectedChat(chat);
        try {
            const data = await adminAPI.getChatMessages(chat.id);
            setChatMessages(data.messages || data || []);
        } catch (err) {
            console.error('Failed to load messages:', err);
            setChatMessages([]);
        }
    };

    // Send reply
    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedChat) return;
        setSendingReply(true);
        try {
            await adminAPI.replyToChat(selectedChat.id, replyText.trim());
            setReplyText('');
            // Reload messages
            const data = await adminAPI.getChatMessages(selectedChat.id);
            setChatMessages(data.messages || data || []);
        } catch (err) {
            console.error('Failed to send reply:', err);
        } finally {
            setSendingReply(false);
        }
    };

    // Close chat
    const handleCloseChat = async (chatId) => {
        try {
            await adminAPI.closeChat(chatId);
            loadChats();
            if (selectedChat?.id === chatId) {
                setSelectedChat(null);
                setChatMessages([]);
            }
        } catch (err) {
            console.error('Failed to close chat:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Filter chats
    const filteredChats = chats.filter(chat => {
        const matchesSearch = !searchTerm || 
            (chat.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (chat.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (chat.user?.contactPerson || chat.user?.FullName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'open' && chat.status !== 'Closed') ||
            (statusFilter === 'closed' && chat.status === 'Closed');

        return matchesSearch && matchesStatus;
    });

    const openChatsCount = chats.filter(c => c.status !== 'Closed').length;
    const closedChatsCount = chats.filter(c => c.status === 'Closed').length;

    if (authLoading) {
        return (
            <div className="sp-loading">
                <Loader2 className="sp-spinner" size={40} />
                <span>Загрузка...</span>
            </div>
        );
    }

    return (
        <div className="sp-page" data-theme={theme?.name || 'default'}>
            <Navbar />
            <div className="sp-container">
                {/* Sidebar */}
                <aside className="sp-sidebar">
                    <div className="sp-sidebar-header">
                        <div className="sp-user-info">
                            <div className="sp-avatar">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3>Панель Поддержки</h3>
                                <span className="sp-user-email">{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="sp-stats">
                        <div className="sp-stat-card sp-stat-open">
                            <AlertCircle size={18} />
                            <div>
                                <span className="sp-stat-number">{openChatsCount}</span>
                                <span className="sp-stat-label">Открытые</span>
                            </div>
                        </div>
                        <div className="sp-stat-card sp-stat-closed">
                            <CheckCircle size={18} />
                            <div>
                                <span className="sp-stat-number">{closedChatsCount}</span>
                                <span className="sp-stat-label">Закрытые</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="sp-nav">
                        <button 
                            className={`sp-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            <MessageCircle size={18} />
                            Обращения
                        </button>
                    </nav>

                    <div className="sp-sidebar-footer">
                        <button className="sp-logout-btn" onClick={handleLogout}>
                            <LogOut size={18} />
                            Выйти
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="sp-main">
                    {/* Header */}
                    <div className="sp-header">
                        <div className="sp-header-left">
                            {selectedChat && (
                                <button className="sp-back-btn" onClick={() => { setSelectedChat(null); setChatMessages([]); }}>
                                    <ArrowLeft size={18} />
                                </button>
                            )}
                            <h2>{selectedChat ? `Чат #${selectedChat.id}` : 'Обращения клиентов'}</h2>
                        </div>
                        <div className="sp-header-right">
                            <button className="sp-refresh-btn" onClick={loadChats} title="Обновить">
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chat list or conversation view */}
                    {!selectedChat ? (
                        <div className="sp-chat-list-view">
                            {/* Filters */}
                            <div className="sp-filters">
                                <div className="sp-search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Поиск по теме, email, имени..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="sp-filter-tabs">
                                    <button 
                                        className={statusFilter === 'all' ? 'active' : ''}
                                        onClick={() => setStatusFilter('all')}
                                    >
                                        <Filter size={14} /> Все ({chats.length})
                                    </button>
                                    <button 
                                        className={statusFilter === 'open' ? 'active' : ''}
                                        onClick={() => setStatusFilter('open')}
                                    >
                                        <AlertCircle size={14} /> Открытые ({openChatsCount})
                                    </button>
                                    <button 
                                        className={statusFilter === 'closed' ? 'active' : ''}
                                        onClick={() => setStatusFilter('closed')}
                                    >
                                        <CheckCircle size={14} /> Закрытые ({closedChatsCount})
                                    </button>
                                </div>
                            </div>

                            {/* Chat list */}
                            {loading ? (
                                <div className="sp-loading-inline">
                                    <Loader2 className="sp-spinner" size={24} />
                                    Загрузка обращений...
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="sp-empty">
                                    <MessageSquare size={48} />
                                    <h3>Нет обращений</h3>
                                    <p>Обращения клиентов появятся здесь</p>
                                </div>
                            ) : (
                                <div className="sp-chats">
                                    {filteredChats.map(chat => (
                                        <div 
                                            key={chat.id} 
                                            className={`sp-chat-card ${chat.status === 'Closed' ? 'closed' : ''}`}
                                            onClick={() => openChat(chat)}
                                        >
                                            <div className="sp-chat-card-left">
                                                <div className="sp-chat-avatar">
                                                    <User size={18} />
                                                </div>
                                                <div className="sp-chat-info">
                                                    <div className="sp-chat-subject">
                                                        {chat.subject || `Обращение #${chat.id}`}
                                                    </div>
                                                    <div className="sp-chat-client">
                                                        <Mail size={12} />
                                                        {chat.user?.email || chat.user?.Email || 'Неизвестно'}
                                                    </div>
                                                    {chat.lastMessage && (
                                                        <div className="sp-chat-preview">
                                                            {chat.lastMessage.substring(0, 80)}{chat.lastMessage.length > 80 ? '...' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="sp-chat-card-right">
                                                <span className={`sp-status ${chat.status === 'Closed' ? 'closed' : 'open'}`}>
                                                    {chat.status === 'Closed' ? 'Закрыт' : 'Открыт'}
                                                </span>
                                                <span className="sp-chat-time">
                                                    <Clock size={12} />
                                                    {new Date(chat.createdAt || chat.created_at || Date.now()).toLocaleDateString('ru-RU')}
                                                </span>
                                                {chat.status !== 'Closed' && (
                                                    <button 
                                                        className="sp-close-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleCloseChat(chat.id); }}
                                                        title="Закрыть обращение"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Conversation View */
                        <div className="sp-conversation">
                            {/* Client info bar */}
                            <div className="sp-client-bar">
                                <div className="sp-client-info">
                                    <User size={16} />
                                    <span>{selectedChat.user?.contactPerson || selectedChat.user?.FullName || 'Клиент'}</span>
                                </div>
                                <div className="sp-client-meta">
                                    <span><Mail size={12} /> {selectedChat.user?.email || selectedChat.user?.Email || '—'}</span>
                                    <span><Phone size={12} /> {selectedChat.user?.phone || selectedChat.user?.Phone || '—'}</span>
                                </div>
                                {selectedChat.status !== 'Closed' && (
                                    <button className="sp-close-chat-btn" onClick={() => handleCloseChat(selectedChat.id)}>
                                        <XCircle size={14} /> Закрыть
                                    </button>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="sp-messages">
                                {chatMessages.length === 0 ? (
                                    <div className="sp-empty-messages">
                                        <MessageSquare size={32} />
                                        <p>Нет сообщений</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => (
                                        <div key={msg.id || idx} className={`sp-msg ${msg.is_admin || msg.isAdmin || msg.sender === 'admin' || msg.sender === 'support' ? 'admin' : 'client'}`}>
                                            <div className="sp-msg-bubble">
                                                <p>{msg.message || msg.content || msg.text}</p>
                                                <span className="sp-msg-time">
                                                    {new Date(msg.createdAt || msg.created_at || msg.timestamp || Date.now()).toLocaleString('ru-RU')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Reply input */}
                            {selectedChat.status !== 'Closed' && (
                                <div className="sp-reply-bar">
                                    <input
                                        type="text"
                                        placeholder="Введите ответ..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                                    />
                                    <button 
                                        onClick={handleSendReply} 
                                        disabled={!replyText.trim() || sendingReply}
                                        className="sp-send-btn"
                                    >
                                        {sendingReply ? <Loader2 className="sp-spinner" size={18} /> : <Send size={18} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SupportPanelPage;
