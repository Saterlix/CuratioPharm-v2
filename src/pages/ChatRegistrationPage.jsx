import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Building, User, Mail, Phone, Send, Loader2, ArrowLeft, Lock, MapPin } from 'lucide-react';
import { authAPI } from '../services/api';

import Navbar from './Navbar';
import './ChatRegistrationPage.css';

const STORAGE_KEY = 'cp_reg_session';

const ChatRegistrationPage = () => {

    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        userType: 'Individual',
        companyName: '',
        name: '',
        email: '',
        phone: '',
        inn: '',
        address: '',
        password: '',
        confirmPassword: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        if (formData.password.length < 6) {
            setError('Пароль должен содержать не менее 6 символов');
            return;
        }

        setLoading(true);
        try {
            const data = {
                userType: formData.userType,
                companyName: formData.userType === 'LegalEntity' ? formData.companyName : null,
                inn: formData.userType === 'LegalEntity' ? formData.inn : null,
                fullName: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address || null,
                password: formData.password
            };

            await authAPI.register(data);
            setStep('success');
        } catch (err) {
            setError(err.message || 'Не удалось зарегистрироваться');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <>
                <Navbar />
                <main className="page-content">
                    <section className="login-section">
                        <div className="login-container" style={{ maxWidth: '500px' }}>
                            <div className="login-card" style={{ textAlign: 'center' }}>
                                <div className="reg-success" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
                                    <div className="reg-success-icon" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>✓</div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '750', margin: 0 }}>Регистрация прошла успешно!</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                                        Добро пожаловать в Curatio Pharm. Теперь вы можете войти в свой аккаунт.
                                    </p>
                                    <Link to="/login" className="login-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Войти в аккаунт
                                    </Link>
                                    <Link to="/" className="login-help" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <ArrowLeft size={16} /> На главную
                                    </Link>
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
                <section className="login-section">
                    <div className="login-container" style={{ maxWidth: '560px' }}>
                        <div className="login-card">
                            <div className="login-header" style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div className="login-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'var(--icon-bg, rgba(16, 185, 129, 0.1))', color: 'var(--primary)', marginBottom: '16px' }}>
                                    <User size={28} />
                                </div>
                                <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Создать аккаунт</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                                    Заполните данные для регистрации. Это займёт не более минуты.
                                </p>
                            </div>

                            {/* User Type Switcher using LoginPage tabs styling */}
                            <div className="login-tabs" style={{ marginBottom: '24px' }}>
                                <button
                                    type="button"
                                    className={`login-tab ${formData.userType === 'Individual' ? 'active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, userType: 'Individual' }))}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 10px', fontSize: '0.9rem' }}
                                >
                                    <User size={16} />
                                    Физ. лицо
                                </button>
                                <button
                                    type="button"
                                    className={`login-tab ${formData.userType === 'LegalEntity' ? 'active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, userType: 'LegalEntity' }))}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 10px', fontSize: '0.9rem' }}
                                >
                                    <Building size={16} />
                                    Юр. лицо / Аптека
                                </button>
                            </div>

                            {error && <div className="login-error" style={{ marginBottom: '16px' }}>{error}</div>}

                            <form onSubmit={handleFormSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                {formData.userType === 'LegalEntity' && (
                                    <>
                                        <div className="chat-reg-section-label" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', opacity: 0.8, marginBottom: '-8px' }}>Реквизиты организации</div>
                                        <div className="login-field">
                                            <label><Building size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> Название компании / аптеки *</label>
                                            <input
                                                name="companyName"
                                                value={formData.companyName}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="ООО «Название организации»"
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="login-field">
                                            <label><Building size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> ИНН *</label>
                                            <input
                                                name="inn"
                                                value={formData.inn}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="ИНН организации"
                                                autoComplete="off"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="chat-reg-section-label" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', opacity: 0.8, marginBottom: '-8px', marginTop: '4px' }}>
                                    {formData.userType === 'LegalEntity' ? 'Контактное лицо' : 'Личные данные'}
                                </div>

                                <div className="login-field">
                                    <label><User size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> {formData.userType === 'LegalEntity' ? 'Контактное лицо' : 'Имя и фамилия'} *</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Имя и фамилия"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="chat-reg-row" style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 600 ? '1fr 1fr' : '1fr', gap: '14px' }}>
                                    <div className="login-field">
                                        <label><Mail size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="email@example.com"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="login-field">
                                        <label><Phone size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> Телефон *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="+998 __ ___-__-__"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                <div className="login-field">
                                    <label>
                                        <MapPin size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> 
                                        Адрес доставки 
                                        <span style={{ fontSize: '0.7rem', fontWeight: '500', color: 'var(--text-secondary)', opacity: 0.7, background: 'rgba(100, 116, 139, 0.08)', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px' }}>необязательно</span>
                                    </label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Город, район, улица..."
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="chat-reg-section-label" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', opacity: 0.8, marginBottom: '-8px', marginTop: '4px' }}>Безопасность</div>

                                <div className="chat-reg-row" style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 600 ? '1fr 1fr' : '1fr', gap: '14px' }}>
                                    <div className="login-field">
                                        <label><Lock size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> Пароль *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Не менее 6 символов"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <div className="login-field">
                                        <label><Lock size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} /> Повторите пароль *</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Повторите пароль"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="login-button" disabled={loading} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {loading ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
                                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                                </button>
                            </form>

                            <div className="login-help" style={{ textAlign: 'center', marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                                <Link to="/login" className="register-link" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <ArrowLeft size={16} /> Уже есть аккаунт? Войти
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
};

export default ChatRegistrationPage;
