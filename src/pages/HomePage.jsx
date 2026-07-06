import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, Target, Award, CheckCircle, ArrowRight,
    Thermometer, Snowflake, Shield, Clock, Truck,
    MapPin, Phone, Mail, Microscope, Users, Globe
} from 'lucide-react';
import Navbar from './Navbar';
import Hero from './Hero';
import { usePageStyle } from '../context/PageStyleContext';
import './pages-dark.css';

const ActivitiesCarousel = ({ dark }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        { id: 1, title: 'Современный складской комплекс', description: 'Наш логистический центр площадью 5000 кв.м. оснащен передовыми системами климат-контроля и автоматизированного учета, что гарантирует сохранность и быструю обработку продукции.', icon: <Building2 size={52} />, color: '#3b82f6' },
        { id: 2, title: 'Собственный автопарк', description: 'Более 20 современных автомобилей, оборудованных рефрижераторами, обеспечивают оперативную доставку лекарственных средств с соблюдением температурного режима в любую точку страны.', icon: <Truck size={52} />, color: '#10b981' },
        { id: 3, title: 'Контроль качества', description: 'Многоступенчатая система контроля качества на всех этапах: от приемки товара до отгрузки клиенту. Мы строго следуем стандартам GDP и требованиям Минздрава.', icon: <Shield size={52} />, color: '#8b5cf6' },
        { id: 4, title: 'Команда профессионалов', description: 'В нашей команде работают высококвалифицированные специалисты с многолетним опытом в фармацевтической сфере, готовые решить любые задачи наших партнеров.', icon: <Users size={52} />, color: '#f59e0b' },
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (dark) {
        const slide = slides[currentSlide];
        return (
            <div style={{ marginBottom: 48, position: 'relative' }}>
                <div className="dp-glass-card" style={{ textAlign: 'center', padding: 48, minHeight: 220, transition: 'all 0.5s ease' }}>
                    <div style={{ width: 80, height: 80, background: slide.color, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff', boxShadow: `0 12px 30px ${slide.color}55` }}>
                        {slide.icon}
                    </div>
                    <div className="dp-card-title" style={{ fontSize: '1.3rem', marginBottom: 12 }}>{slide.title}</div>
                    <p className="dp-card-text" style={{ maxWidth: 500, margin: '0 auto' }}>{slide.description}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    {slides.map((_, i) => (
                        <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: i === currentSlide ? 24 : 8, height: 8, borderRadius: 4, background: i === currentSlide ? '#10b981' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s ease' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="activities-carousel">
            <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {slides.map((slide) => (
                    <div key={slide.id} className="carousel-slide">
                        <div className="slide-icon" style={{ backgroundColor: slide.color }}>{slide.icon}</div>
                        <div className="slide-content"><h3>{slide.title}</h3><p>{slide.description}</p></div>
                    </div>
                ))}
            </div>
            <div className="carousel-dots">
                {slides.map((_, index) => (
                    <div key={index} className={`dot ${currentSlide === index ? 'active' : ''}`} onClick={() => setCurrentSlide(index)} />
                ))}
            </div>
        </div>
    );
};

/* ── Dark Home sections ──────────────────────────────────────── */
const HomeDark = () => (
    <div className="dark-page" style={{ marginTop: 0, paddingTop: 0 }}>
        <div className="dp-blob dp-blob-1" />
        <div className="dp-blob dp-blob-2" />

        {/* About Preview */}
        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>О компании</div>
                <h2 className="dp-section-title">Надёжный партнёр</h2>
                <p className="dp-section-subtitle">в сфере фармацевтической дистрибуции</p>
                <ActivitiesCarousel dark />
                <div className="dp-grid-3">
                    {[
                        { icon: <Building2 size={24} />, t: 'Наша Компания', p: 'MCHJ «Curatio Pharm» — институциональный импортер по стандартам GDP.' },
                        { icon: <Target size={24} />, t: 'Наша Миссия', p: 'Обеспечить доступность качественных лекарств для каждого.' },
                        { icon: <Award size={24} />, t: 'Наши Ценности', p: 'Качество, надёжность и ответственность — основа нашей работы.' },
                    ].map((c, i) => (
                        <div key={i} className="dp-glass-card featured">
                            <div className="dp-icon">{c.icon}</div>
                            <div className="dp-card-title">{c.t}</div>
                            <p className="dp-card-text">{c.p}</p>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Link to="/about" className="dp-btn-primary">Подробнее о компании <ArrowRight size={16} /></Link>
                </div>
            </div>
        </section>

        {/* Storage */}
        <section className="dp-section dp-section-alt">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>Инфраструктура</div>
                <h2 className="dp-section-title">Условия хранения</h2>
                <p className="dp-section-subtitle">Современные складские помещения с соблюдением всех требований</p>
                <div className="dp-grid-3">
                    {[
                        { icon: <Thermometer size={24} />, t: 'Температурный контроль', p: 'Постоянный мониторинг температуры. Автоматическая система климат-контроля.', badge: '+15°C до +25°C' },
                        { icon: <Snowflake size={24} />, t: 'Холодильные камеры', p: 'Специальные камеры для термолабильных препаратов с резервным питанием.', badge: '+2°C до +8°C' },
                        { icon: <Shield size={24} />, t: 'Безопасность', p: 'Круглосуточная охрана, видеонаблюдение и противопожарная система.', badge: '24/7' },
                    ].map((c, i) => (
                        <div key={i} className="dp-glass-card">
                            <div className="dp-icon">{c.icon}</div>
                            <div className="dp-card-title">{c.t}</div>
                            <p className="dp-card-text" style={{ marginBottom: 16 }}>{c.p}</p>
                            <div className="dp-tag" style={{ marginBottom: 0 }}>{c.badge}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Delivery */}
        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-grid-2" style={{ alignItems: 'center', gap: 56 }}>
                    <div>
                        <div className="dp-tag" style={{ marginBottom: 16 }}>Логистика</div>
                        <h2 className="dp-section-title" style={{ textAlign: 'left', marginBottom: 16 }}>Доставка в день заказа</h2>
                        <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: 24 }}>Заказы, оформленные до 12:00, доставляются в тот же день по городу и области.</p>
                        <ul className="dp-benefits-list" style={{ marginBottom: 32 }}>
                            {['Заказ до 12:00 — доставка сегодня', 'Собственный автопарк 20+ машин', 'Термоконтейнеры для препаратов', 'SMS-уведомления о доставке'].map((b, i) => (
                                <li key={i}><CheckCircle size={16} /> {b}</li>
                            ))}
                        </ul>
                        <Link to="/delivery" className="dp-btn-primary">Подробнее о доставке <ArrowRight size={16} /></Link>
                    </div>
                    <div className="dp-glass-card" style={{ padding: 32 }}>
                        {[
                            { icon: <Clock size={20} />, time: 'До 12:00', desc: 'Оформление заказа' },
                            { icon: <Shield size={20} />, time: '12:00–14:00', desc: 'Сборка и проверка' },
                            { icon: <Truck size={20} />, time: '14:00–18:00', desc: 'Доставка' },
                        ].map((item, i, arr) => (
                            <React.Fragment key={i}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6ee7b7', flexShrink: 0 }}>{item.icon}</div>
                                    <div>
                                        <div style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '0.9rem' }}>{item.time}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{item.desc}</div>
                                    </div>
                                </div>
                                {i < arr.length - 1 && <div style={{ width: 2, height: 20, background: 'rgba(16,185,129,0.2)', margin: '8px 0 8px 21px' }} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Partners */}
        <section className="dp-section dp-section-alt">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>Партнёрство</div>
                <h2 className="dp-section-title">Стратегическое партнёрство</h2>
                <p className="dp-section-subtitle">Официальная дистрибуция и государственные контракты (B2G)</p>
                <div className="dp-grid-2">
                    {[
                        { badge: 'Официальный партнёр', title: 'Сотрудничество с GSK', body: 'MCHJ «Curatio Pharm» выступает ключевым дистрибьютором GlaxoSmithKline (GSK) в регионе. Поставки вакцин и оригинальных препаратов с соблюдением стандартов GDP и холодовой цепи.', footer: 'Надёжность и оригинальное качество продукции' },
                        { badge: 'Гос. поставки (B2G)', title: 'Поставки государственному сектору', body: 'Активное участие в государственных тендерных процедурах B2G. Прямые оптовые поставки для клинических центров и аптечных сетей Минздрава.', footer: 'Обеспечение лечебно-профилактических учреждений' },
                    ].map((p, i) => (
                        <div key={i} className="dp-glass-card">
                            <div className="dp-tag" style={{ marginBottom: 16 }}>{p.badge}</div>
                            <div className="dp-card-title" style={{ fontSize: '1.15rem', marginBottom: 12 }}>{p.title}</div>
                            <p className="dp-card-text" style={{ marginBottom: 16 }}>{p.body}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6ee7b7', fontSize: '0.85rem', fontWeight: 600 }}>
                                <Award size={16} /> {p.footer}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Why us */}
        <section className="dp-section">
            <div className="dp-container">
                <h2 className="dp-section-title">Почему выбирают нас</h2>
                <div className="dp-divider" style={{ margin: '16px auto 48px' }} />
                <div className="dp-grid-3">
                    {[
                        'Сертифицированная продукция',
                        'Прямые контракты с производителями',
                        'Конкурентные цены',
                        'Быстрая доставка по Узбекистану',
                        'Соблюдение холодовой цепи',
                        'Персональный менеджер',
                    ].map((adv, i) => (
                        <div key={i} className="dp-glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px' }}>
                            <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                            <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.92rem' }}>{adv}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

/* ── Classic Home sections ───────────────────────────────────── */
const HomeClassic = () => (
    <main>
        <section className="section section-alt">
            <div className="container">
                <h2 className="section-title">О Компании</h2>
                <p className="section-subtitle">Надежный партнер в сфере фармацевтической дистрибуции</p>
                <div style={{ marginBottom: '60px' }}><ActivitiesCarousel /></div>
                <div className="about-grid">
                    <div className="about-card"><div className="icon-wrapper"><Building2 size={32} /></div><h3>Наша Компания</h3><p>MCHJ «Curatio Pharm» — институциональный импортер, осуществляющий оптовую торговлю лекарственными средствами в соответствии со стандартами GDP.</p></div>
                    <div className="about-card"><div className="icon-wrapper"><Target size={32} /></div><h3>Наша Миссия</h3><p>Обеспечить доступность качественных лекарственных средств для каждого.</p></div>
                    <div className="about-card"><div className="icon-wrapper"><Award size={32} /></div><h3>Наши Ценности</h3><p>Качество, надежность и ответственность — основа нашей работы.</p></div>
                </div>
                <div className="section-cta"><Link to="/about" className="btn-primary">Подробнее о компании <ArrowRight size={18} /></Link></div>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <h2 className="section-title">Условия хранения</h2>
                <p className="section-subtitle">Современные складские помещения с соблюдением всех требований</p>
                <div className="storage-grid">
                    <div className="storage-card"><div className="storage-icon"><Thermometer size={36} /></div><h3>Температурный контроль</h3><p>Постоянный мониторинг температуры во всех зонах хранения.</p><div className="storage-badge">+15°C до +25°C</div></div>
                    <div className="storage-card"><div className="storage-icon cold"><Snowflake size={36} /></div><h3>Холодильные камеры</h3><p>Специальные холодильные камеры для термолабильных препаратов.</p><div className="storage-badge cold">+2°C до +8°C</div></div>
                    <div className="storage-card"><div className="storage-icon"><Shield size={36} /></div><h3>Безопасность</h3><p>Круглосуточная охрана, видеонаблюдение и противопожарная система.</p><div className="storage-badge">24/7</div></div>
                </div>
            </div>
        </section>
        <section className="section delivery-demo-section">
            <div className="container">
                <div className="delivery-demo">
                    <div className="delivery-demo-content">
                        <div className="delivery-badge-large"><Clock size={32} /><span>День в День</span></div>
                        <h2>Доставка в день заказа</h2>
                        <p>Заказы, оформленные до 12:00, доставляются в тот же день по городу и области.</p>
                        <ul className="delivery-features">
                            <li><CheckCircle size={20} /> Заказ до 12:00 — доставка сегодня</li>
                            <li><CheckCircle size={20} /> Собственный автопарк 20+ машин</li>
                            <li><CheckCircle size={20} /> Термоконтейнеры для препаратов</li>
                            <li><CheckCircle size={20} /> SMS-уведомления о доставке</li>
                        </ul>
                        <Link to="/delivery" className="btn-primary">Подробнее о доставке <ArrowRight size={18} /></Link>
                    </div>
                    <div className="delivery-demo-visual">
                        <div className="delivery-timeline">
                            <div className="timeline-item active"><div className="timeline-icon"><Clock size={20} /></div><div className="timeline-text"><strong>До 12:00</strong><span>Оформление заказа</span></div></div>
                            <div className="timeline-line" />
                            <div className="timeline-item active"><div className="timeline-icon"><Shield size={20} /></div><div className="timeline-text"><strong>12:00 - 14:00</strong><span>Сборка и проверка</span></div></div>
                            <div className="timeline-line" />
                            <div className="timeline-item active"><div className="timeline-icon"><Truck size={20} /></div><div className="timeline-text"><strong>14:00 - 18:00</strong><span>Доставка</span></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section className="section partnerships-section" style={{ padding: '80px 0', background: 'var(--bg-alt, #f8fafc)' }}>
            <div className="container">
                <h2 className="section-title" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Стратегическое партнерство</h2>
                <p className="section-subtitle" style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px', fontSize: '1rem' }}>Официальная дистрибуция и государственные контракты (B2G)</p>
                <div className="partnerships-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div className="partnership-card" style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: '#eff6ff', color: '#1e40af', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', alignSelf: 'flex-start', textTransform: 'uppercase' }}>Официальный партнер</div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 'bold' }}>Сотрудничество с GSK</h3>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: '1.6' }}>MCHJ «Curatio Pharm» выступает ключевым дистрибьютором <strong>GlaxoSmithKline (GSK)</strong>. Поставки вакцин и оригинальных препаратов с соблюдением стандартов GDP.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '600', fontSize: '0.9rem', marginTop: 'auto' }}><Award size={18} /> Надежность и оригинальное качество продукции</div>
                    </div>
                    <div className="partnership-card" style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: '#f0fdf4', color: '#15803d', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', alignSelf: 'flex-start', textTransform: 'uppercase' }}>Гос. поставки (B2G)</div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 'bold' }}>Поставки государственному сектору</h3>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: '1.6' }}>Активное участие в государственных тендерных процедурах B2G. Прямые поставки для учреждений Министерства здравоохранения.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '600', fontSize: '0.9rem', marginTop: 'auto' }}><Building2 size={18} /> Обеспечение лечебно-профилактических учреждений</div>
                    </div>
                </div>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <h2 className="section-title">Почему выбирают нас</h2>
                <div className="advantages-grid">
                    {['Сертифицированная продукция', 'Прямые контракты с производителями', 'Конкурентные цены', 'Быстрая доставка по Узбекистану', 'Соблюдение холодовой цепи', 'Персональный менеджер'].map((adv, i) => (
                        <div key={i} className="advantage-item"><CheckCircle size={24} className="advantage-icon" /><span>{adv}</span></div>
                    ))}
                </div>
            </div>
        </section>
    </main>
);

/* ── Main exported page ──────────────────────────────────────── */
const HomePage = () => {
    const { isNatureStyle } = usePageStyle();
    return (
        <>
            <Navbar />
            <Hero />
            {isNatureStyle ? <HomeDark /> : <HomeClassic />}
        </>
    );
};

export default HomePage;
