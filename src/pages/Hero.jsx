import React, { useEffect, useRef } from 'react';
import { ArrowRight, PlayCircle, Snowflake, ShieldCheck, Clock, CalendarCheck, Pill, MapPin, Users } from 'lucide-react';
import './Hero.css';

const Hero = () => {
    const dustContainerRef = useRef(null);

    useEffect(() => {
        const dc = dustContainerRef.current;
        if (!dc) return;
        
        // Clear previous dust if any
        dc.innerHTML = '';
        
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        for (let i = 0; i < 16; i++) {
            const d = document.createElement('div');
            d.className = 'dust';
            d.style.left = Math.random() * 100 + '%';
            const duration = 8 + Math.random() * 8;
            d.style.animationDelay = `-${Math.random() * duration}s`;
            d.style.animationDuration = duration + 's';
            const s = 2 + Math.random() * 3;
            d.style.width = s + 'px';
            d.style.height = s + 'px';
            d.style.opacity = 0.2 + Math.random() * 0.5;
            dc.appendChild(d);
        }
    }, []);

    return (
        <section className="hero-section-new">
            {/* Background */}
            <div className="hero-bg-layer">
                <div className="nature-photo"></div>
                <div className="hero-bg-base"></div>

                {/* Animated glowing text */}
                <div className="bg-text-layer">
                    <div className="bg-text-item">С заботой о ближнем!</div>
                    <div className="bg-text-item">Здоровье — наша миссия</div>
                    <div className="bg-text-item">Качество. Надёжность. Забота.</div>
                </div>

                <div className="light-rays">
                    <div className="ray ray-1" style={{ '--r': '-15deg' }}></div>
                    <div className="ray ray-2" style={{ '--r': '5deg' }}></div>
                    <div className="ray ray-3" style={{ '--r': '-8deg' }}></div>
                    <div className="ray ray-4" style={{ '--r': '12deg' }}></div>
                </div>
                
                <div className="organic-shapes">
                    <div className="organic org-leaf o1"></div>
                    <div className="organic org-drop o2"></div>
                    <div className="organic org-mol o3"></div>
                    <div className="organic org-cross o4"></div>
                    <div className="organic org-leaf o5"></div>
                    <div className="organic org-drop o6"></div>
                    <div className="organic org-mol o7"></div>
                    <div className="organic org-cross o8"></div>
                    <div className="organic org-leaf o9"></div>
                    <div className="organic org-drop o10"></div>
                </div>
                <div className="dust-container" ref={dustContainerRef}></div>
                <div className="vignette"></div>
            </div>
            
            <div className="hero-overlay-new"></div>

            {/* Main Content */}
            <div className="hero-main">
                <div className="hero-inner">
                    <div className="hero-text">
                        <div className="hero-tag">
                            <span className="dot"></span>
                            Фармацевтическая дистрибуция
                        </div>

                        <div className="hero-brand">
                            <span className="brand-curatio">Curatio</span><span className="brand-pharm">Pharm</span>
                            <span className="brand-dot"></span>
                        </div>

                        <h1 className="hero-title">
                            Поставляем <em>здоровье</em><br />по всему Узбекистану
                        </h1>

                        <p className="hero-subtitle">
                            Институциональный дистрибьютор лекарственных средств. Прямые контракты с мировыми производителями, собственная логистика с соблюдением холодовой цепи и доставка день-в-день.
                        </p>

                        <div className="hero-cta-group">
                            <a href="/cooperation" className="btn-primary-new">
                                Стать партнёром
                                <ArrowRight size={18} />
                            </a>
                            <a href="/about" className="btn-secondary-new">
                                <PlayCircle size={18} />
                                О компании
                            </a>
                        </div>
                    </div>

                    <div className="hero-cards">
                        <div className="info-card">
                            <div className="info-card-icon"><Snowflake size={20} /></div>
                            <div className="info-card-content">
                                <h4>Холодовая цепь +2...+8°C</h4>
                                <p>Полный контроль температуры от склада до клиента. Рефрижераторный автопарк 20+ машин.</p>
                            </div>
                            <div className="card-glow"></div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><ShieldCheck size={20} /></div>
                            <div className="info-card-content">
                                <h4>Стандарт GDP</h4>
                                <p>Международные сертификаты качества. Каждая партия проходит многоступенчатую проверку.</p>
                            </div>
                            <div className="card-glow"></div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><Clock size={20} /></div>
                            <div className="info-card-content">
                                <h4>Доставка день-в-день</h4>
                                <p>Заказ до 12:00 — получение сегодня. Оперативная логистика по городу и области.</p>
                            </div>
                            <div className="card-glow"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Bar */}
            <div className="hero-bottom">
                <div className="trust-bar">
                    <div className="trust-item">
                        <div className="trust-icon"><CalendarCheck size={18} /></div>
                        <div className="trust-text">
                            <span className="trust-value">15+</span>
                            <span className="trust-label">Лет на рынке</span>
                        </div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-icon"><Pill size={18} /></div>
                        <div className="trust-text">
                            <span className="trust-value">5 000+</span>
                            <span className="trust-label">Наименований</span>
                        </div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-icon"><MapPin size={18} /></div>
                        <div className="trust-text">
                            <span className="trust-value">7+</span>
                            <span className="trust-label">Регионов</span>
                        </div>
                    </div>
                    <div className="trust-item">
                        <div className="trust-icon"><Users size={18} /></div>
                        <div className="trust-text">
                            <span className="trust-value">1 200+</span>
                            <span className="trust-label">Клиентов</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Black Ribbon Divider */}
            <div className="hero-ribbon-divider"></div>
        </section>
    );
};

export default Hero;
