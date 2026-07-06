import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, LogIn, Mail, Loader2, KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { getRoleHome } from '../utils/roles';
import Navbar from './Navbar';
import './LoginPage.css';

const LoginPage = () => {
    const [activeTab, setActiveTab] = useState('password'); // 'password' or 'otp'
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    
    // Change password fields
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changeSuccess, setChangeSuccess] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { 
        login: loginUser, 
        loginOtp, 
        changePassword, 
        mustChangePassword, 
        isAuthenticated, 
        loading: authLoading,
        user
    } = useAuth();
    
    const navigate = useNavigate();

    // If logged in and password change not required, redirect to cabinet
    React.useEffect(() => {
        if (isAuthenticated && !mustChangePassword) {
            navigate(getRoleHome(user?.role));
        }
    }, [isAuthenticated, mustChangePassword, navigate, user?.role]);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await loginUser(login, password);

        if (result.success) {
            if (result.must_change_password) {
                // Form will automatically show password change UI
            } else {
                navigate(getRoleHome(result.user?.role));
            }
        } else {
            setError(result.error || 'Неверный логин или пароль');
        }

        setLoading(false);
    };

    const handleOtpLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await loginOtp(otpCode.trim());

        if (result.success) {
            // OTP login always requires password change
        } else {
            setError(result.error || 'Недействительный или просроченный OTP код');
        }

        setLoading(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);
        const result = await changePassword(newPassword);

        if (result.success) {
            setChangeSuccess(true);
            setTimeout(() => {
                navigate(getRoleHome(user?.role));
            }, 1500);
        } else {
            setError(result.error || 'Не удалось изменить пароль');
        }
        setLoading(false);
    };

    if (authLoading) {
        return (
            <>
                <Navbar />
                <main className="page-content">
                    <section className="login-section">
                        <div className="login-container">
                            <div className="login-card">
                                <div className="login-loading">
                                    <Loader2 size={48} className="spin" />
                                    <p>Загрузка...</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    // Force Password Change Screen
    if (mustChangePassword) {
        return (
            <>
                <Navbar />
                <main className="page-content">
                    <section className="login-section">
                        <div className="login-container">
                            <div className="login-card password-change-card">
                                <div className="login-header">
                                    <div className="login-icon otp-glow">
                                        <KeyRound size={32} />
                                    </div>
                                    <h1>Смена пароля</h1>
                                    <p>Для безопасности необходимо установить новый постоянный пароль</p>
                                </div>

                                {changeSuccess ? (
                                    <div className="password-change-success">
                                        <ShieldCheck size={48} className="success-icon" />
                                        <h3>Пароль успешно изменён!</h3>
                                        <p>Перенаправление в личный кабинет...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="login-form">
                                        {error && <div className="login-error">{error}</div>}

                                        <div className="login-field">
                                            <label>
                                                <Lock size={18} />
                                                Новый пароль
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Минимум 6 символов"
                                                required
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="login-field">
                                            <label>
                                                <Lock size={18} />
                                                Подтвердите пароль
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Повторите ввод пароля"
                                                required
                                                disabled={loading}
                                            />
                                        </div>

                                        <button type="submit" className="login-button" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="spin" />
                                                    Сохранение...
                                                </>
                                            ) : (
                                                'Установить пароль'
                                            )}
                                        </button>
                                    </form>
                                )}
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
                    <div className="login-container">
                        <div className="login-card">
                            <div className="login-header">
                                <div className="login-icon">
                                    <Lock size={32} />
                                </div>
                                <h1>Личный кабинет</h1>
                                <p>Выберите способ авторизации</p>
                            </div>

                            <div className="login-tabs">
                                <button 
                                    className={`login-tab ${activeTab === 'password' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('password'); setError(''); }}
                                    disabled={loading}
                                >
                                    Пароль
                                </button>
                                <button 
                                    className={`login-tab ${activeTab === 'otp' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('otp'); setError(''); }}
                                    disabled={loading}
                                >
                                    Код доступа (OTP)
                                </button>
                            </div>

                            {activeTab === 'password' ? (
                                <form onSubmit={handlePasswordLogin} className="login-form">
                                    {error && <div className="login-error">{error}</div>}

                                    <div className="login-field">
                                        <label>
                                            <Mail size={18} />
                                            Логин / Email
                                        </label>
                                        <input
                                            type="text"
                                            value={login}
                                            onChange={(e) => setLogin(e.target.value)}
                                            placeholder="demo@apteka.uz"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="login-field">
                                        <label>
                                            <Lock size={18} />
                                            Пароль
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Введите пароль"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <button type="submit" className="login-button" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="spin" />
                                                Вход...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn size={20} />
                                                Войти
                                            </>
                                        )}
                                    </button>

                                    <div className="login-help">
                                        <Link to="/register" className="register-link">
                                            <UserPlus size={16} />
                                            Нет аккаунта? Зарегистрироваться
                                        </Link>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleOtpLogin} className="login-form">
                                    {error && <div className="login-error">{error}</div>}

                                    <div className="login-field">
                                        <label>
                                            <KeyRound size={18} />
                                            Одноразовый код (OTP)
                                        </label>
                                        <input
                                            type="text"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            placeholder="Введите 8-значный код"
                                            required
                                            maxLength={8}
                                            disabled={loading}
                                            style={{ letterSpacing: '0.15em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                                        />
                                    </div>

                                    <button type="submit" className="login-button" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="spin" />
                                                Проверка кода...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn size={20} />
                                                Войти по коду
                                            </>
                                        )}
                                    </button>

                                    <div className="login-help">
                                        <p>Что такое вход по OTP?</p>
                                        <div className="contact-support">
                                            <p>Администратор может сгенерировать временный одноразовый код для вашего аккаунта.</p>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
};

export default LoginPage;
