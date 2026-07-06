import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome, isBackofficeRole } from '../utils/roles';
import StyleToggle from '../components/StyleToggle';
import './Navbar.scss';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useAuth();
    const canAccessAdmin = isBackofficeRole(user?.role);
    const accountPath = user ? getRoleHome(user.role) : '/login';
    const productsPath = '/products';
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const navRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const closeMenuTimer = window.setTimeout(() => {
            setIsMobileMenuOpen(false);
        }, 0);
        return () => window.clearTimeout(closeMenuTimer);
    }, [location.pathname]);

    useEffect(() => {
        document.body.classList.toggle('mobile-menu-open', isMobileMenuOpen);
        return () => document.body.classList.remove('mobile-menu-open');
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <>
            {/* Navbar */}
            <nav
                ref={navRef}
                className={`navbar ${isScrolled || !isHomePage ? 'scrolled' : ''}`}
            >
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo">
                        <span className="logo-text">Curatio</span>
                        <span className="logo-highlight">Pharm</span>
                    </Link>

                    <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
                        <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>О нас</Link>
                        <Link to={productsPath} onClick={() => setIsMobileMenuOpen(false)}>Продукция</Link>
                        <Link to="/delivery" onClick={() => setIsMobileMenuOpen(false)}>Доставка</Link>
                        <Link to="/cooperation" onClick={() => setIsMobileMenuOpen(false)}>Сотрудничество</Link>
                        <Link to="/contacts" onClick={() => setIsMobileMenuOpen(false)}>Контакты</Link>
                        {canAccessAdmin && <Link to={accountPath} onClick={() => setIsMobileMenuOpen(false)}>Админ панель</Link>}
                        <Link to={accountPath} className="cta-button mobile-only" onClick={() => setIsMobileMenuOpen(false)}>Личный кабинет</Link>
                    </div>

                    <div className="navbar-actions" style={{ zIndex: 10040, display: 'flex', alignItems: 'center' }}>
                        <StyleToggle />
                        <Link to={accountPath} className="cta-button desktop-only">Личный кабинет</Link>
                        <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
                            <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
