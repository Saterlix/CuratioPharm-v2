import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Key, LogIn, Loader2 } from 'lucide-react';
import { getRoleHome } from '../utils/roles';
import Navbar from './Navbar';
import './LoginPage.css';

const AdminLoginPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [adminKey, setAdminKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { adminLogin, isAuthenticated, isAdmin, user } = useAuth();
    const navigate = useNavigate();

    // If already admin, redirect to admin panel
    React.useEffect(() => {
        if (isAuthenticated && isAdmin) {
            navigate(getRoleHome(user?.role));
        }
    }, [isAuthenticated, isAdmin, navigate, user?.role]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await adminLogin(login, password, adminKey);

        if (result.success) {
            navigate(getRoleHome(result.user?.role));
        } else {
            setError(result.error || 'Доступ запрещён');
        }

        setLoading(false);
    };

    return (
        <>
            <Navbar />
            <main className="page-content">
                <section className="login-section">
                    <div className="login-container">
                        <div className="login-card">
                            <div className="login-header">
                                <div className="login-icon" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}>
                                    <Shield size={32} />
                                </div>
                                <h1>Вход администратора</h1>
                                <p>Доступ только для уполномоченных лиц</p>
                            </div>

                            <form onSubmit={handleSubmit} className="login-form">
                                {error && (
                                    <div className="login-error">
                                        {error}
                                    </div>
                                )}

                                <div className="login-field">
                                    <label>
                                        <Lock size={18} />
                                        Логин
                                    </label>
                                    <input
                                        type="text"
                                        value={login}
                                        onChange={(e) => setLogin(e.target.value)}
                                        placeholder="admin"
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

                                <div className="login-field">
                                    <label>
                                        <Key size={18} />
                                        Ключ доступа
                                    </label>
                                    <input
                                        type="password"
                                        value={adminKey}
                                        onChange={(e) => setAdminKey(e.target.value)}
                                        placeholder="Секретный ключ администратора"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="login-button"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="spin" />
                                            Проверка...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={20} />
                                            Войти
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
};

export default AdminLoginPage;
