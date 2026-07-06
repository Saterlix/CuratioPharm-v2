import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Terminal, ShieldAlert, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Footer.css';

const Footer = () => {
    const { isAuthenticated, isAdmin, isDeveloper } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <footer className="footer">
            <div className="container">
                <div className={`footer-grid ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="footer-brand">
                        <h3>Curatio<span>Pharm</span></h3>
                        <button 
                            type="button" 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className="footer-toggle-btn mobile-only-toggle"
                            aria-expanded={isExpanded}
                        >
                            <span>{isExpanded ? 'Скрыть информацию' : 'Подробнее о компании'}</span>
                            <ChevronDown size={16} className={`toggle-icon ${isExpanded ? 'open' : ''}`} />
                        </button>
                        <p className="footer-desc">Оптовая фармацевтическая компания с современным складским комплексом 5000 м²</p>
                        <div className="footer-badges">
                            <div className="badge">
                                <Shield size={16} />
                                <span>Лицензия GDP</span>
                            </div>
                            <div className="badge">
                                <Award size={16} />
                                <span>ISO 9001:2015</span>
                            </div>
                        </div>
                    </div>
                    <div className="footer-nav">
                        <h4>Навигация</h4>
                        <Link to="/about">О компании</Link>
                        <Link to="/products">Продукция</Link>
                        <Link to="/delivery">Доставка</Link>
                        <Link to="/contacts">Контакты</Link>
                    </div>
                    <div className="footer-nav">
                        <h4>Личный кабинет</h4>
                        <Link to="/login">Вход в кабинет</Link>
                        {isAuthenticated && (
                            <>
                                <Link to="/cabinet">Панель партнера</Link>
                                <Link to="/orders">История заказов</Link>
                            </>
                        )}
                        {isAdmin && (
                            <Link to="/cp-admin-panel" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldAlert size={14} /> Админ-панель
                             </Link>
                        )}
                        {isDeveloper && (
                            <Link to="/cp-developer-panel" style={{ color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Terminal size={14} /> Консоль разработчика
                            </Link>
                        )}
                    </div>
                    <div className="footer-contact">
                        <h4>Контакты</h4>
                        <p style={{ margin: '4px 0' }}>+998 (71) 207-01-52</p>
                        <p style={{ margin: '4px 0' }}>info@cpharm.uz</p>
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', lineHeight: '1.4' }}>г. Ташкент, Юнусабадский р-н, ул. Карима Зарипова, 3</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 ООО "Curatio Pharm". Все права защищены.</p>
                    <div className="footer-legal">
                        <a href="#">Политика конфиденциальности</a>
                        <a href="#">Пользовательское соглашение</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
