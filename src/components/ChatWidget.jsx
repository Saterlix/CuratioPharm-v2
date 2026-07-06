import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Headset, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ChatWidget.css';

const ChatWidget = () => {
    const { isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [supportPhone, setSupportPhone] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const normalizeMessage = (msg) => {
        if (!msg) return msg;
        const role = msg.role || (msg.sender_type === 'user'
            ? 'user'
            : msg.sender_type === 'operator' || msg.sender_type === 'system'
                ? 'operator'
                : 'ai');
        return {
            ...msg,
            role,
            content: msg.content || msg.message,
            timestamp: msg.timestamp || msg.created_at
        };
    };

    // Scroll to bottom of messages
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Fetch support phone on mount
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchPhone = async () => {
            try {
                const response = await api.get('/support-settings');
                setSupportPhone(response.data?.phone || response.data?.supportPhone || '');
            } catch (err) {
                console.error('Failed to fetch support phone:', err);
            }
        };
        fetchPhone();
    }, [isAuthenticated]);

    // Start chat conversation
    const handleOpen = async () => {
        setIsOpen(true);
        setIsClosing(false);
        setUnreadCount(0);

        if (!conversationId) {
            setIsLoading(true);
            try {
                const response = await api.post('/chat/start');
                const data = response.data;
                setConversationId(data.conversation?.id || data.conversationId);
                setMessages((data.messages || []).map(normalizeMessage));
            } catch (err) {
                console.error('Failed to start chat:', err);
                setMessages([{
                    id: 'error-init',
                    role: 'ai',
                    content: 'Не удалось подключиться к чату. Попробуйте позже.',
                    timestamp: new Date().toISOString()
                }]);
            } finally {
                setIsLoading(false);
            }
        }

        setTimeout(() => inputRef.current?.focus(), 350);
    };

    // Close with animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 280);
    };

    // Send message
    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text || isSending) return;

        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsSending(true);

        try {
            const response = await api.post('/chat/send', {
                conversationId,
                message: text
            });
            const data = response.data;

            if (data.userMessage) {
                const normalizedUserMessage = normalizeMessage(data.userMessage);
                setMessages(prev => prev.map(m =>
                    m.id === userMsg.id ? { ...m, ...normalizedUserMessage } : m
                ));
            }

            if (data.aiResponse) {
                const normalizedAiResponse = normalizeMessage(data.aiResponse);
                setMessages(prev => [...prev, {
                    id: normalizedAiResponse.id || `ai-${Date.now()}`,
                    role: normalizedAiResponse.role || 'ai',
                    content: normalizedAiResponse.content,
                    timestamp: normalizedAiResponse.timestamp || new Date().toISOString()
                }]);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'ai',
                content: 'Ошибка отправки. Попробуйте ещё раз.',
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsSending(false);
        }
    };

    // Request operator
    const handleRequestOperator = async () => {
        try {
            await api.post('/chat/request-operator', { conversationId });
            setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                role: 'operator',
                content: 'Запрос отправлен. Оператор скоро подключится к чату.',
                timestamp: new Date().toISOString()
            }]);
        } catch (err) {
            console.error('Failed to request operator:', err);
        }
    };

    // Handle key press
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            return new Date(timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    // Don't render for unauthenticated users
    if (!isAuthenticated) return null;

    return (
        <div className="chat-widget">
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    className="chat-fab"
                    onClick={handleOpen}
                    aria-label="Открыть чат поддержки"
                >
                    <MessageCircle size={26} strokeWidth={2.2} />
                    <span className="chat-fab-ripple" />
                    {unreadCount > 0 && (
                        <span className="chat-fab-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className={`chat-panel ${isClosing ? 'chat-panel--closing' : ''}`}>
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-header-avatar">
                                <MessageCircle size={18} />
                            </div>
                            <div className="chat-header-text">
                                <h4 className="chat-header-title">Поддержка Curatio Pharm</h4>
                                <span className="chat-header-status">
                                    <span className="chat-status-dot" />
                                    Онлайн
                                </span>
                            </div>
                        </div>
                        <button className="chat-close-btn" onClick={handleClose} aria-label="Закрыть чат">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {isLoading ? (
                            <div className="chat-loading">
                                <Loader2 size={28} className="chat-spinner" />
                                <span>Подключение...</span>
                            </div>
                        ) : (
                            <>
                                {messages.length === 0 && (
                                    <div className="chat-empty">
                                        <Bot size={36} />
                                        <p>Напишите ваш вопрос — ИИ-ассистент ответит мгновенно</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
                                        {(msg.role === 'ai' || msg.role === 'operator') && (
                                            <div className={`chat-msg-avatar chat-msg-avatar--${msg.role}`}>
                                                {msg.role === 'ai' ? <Bot size={16} /> : <Headset size={16} />}
                                            </div>
                                        )}
                                        <div className={`chat-msg-bubble chat-msg-bubble--${msg.role}`}>
                                            <p className="chat-msg-text">{msg.content}</p>
                                            <span className="chat-msg-time">{formatTime(msg.timestamp)}</span>
                                        </div>
                                        {msg.role === 'ai' && (
                                            <button
                                                className="chat-operator-btn"
                                                onClick={handleRequestOperator}
                                            >
                                                👤 Связаться с оператором
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isSending && (
                                    <div className="chat-msg chat-msg--ai">
                                        <div className="chat-msg-avatar chat-msg-avatar--ai">
                                            <Bot size={16} />
                                        </div>
                                        <div className="chat-msg-bubble chat-msg-bubble--ai chat-typing">
                                            <span className="chat-typing-dot" />
                                            <span className="chat-typing-dot" />
                                            <span className="chat-typing-dot" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="chat-input-area">
                        <div className="chat-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                className="chat-input"
                                placeholder="Введите сообщение..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSending || isLoading}
                            />
                            <button
                                className={`chat-send-btn ${inputValue.trim() ? 'chat-send-btn--active' : ''}`}
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isSending}
                                aria-label="Отправить"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Support Phone */}
                    {supportPhone && (
                        <a href={`tel:${supportPhone}`} className="chat-support-phone">
                            <Phone size={13} />
                            <span>Позвонить: {supportPhone}</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
