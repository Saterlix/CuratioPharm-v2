import React from 'react';
import {
    Building2, Target, Award, Users, History, Trophy,
    Briefcase, GraduationCap, Heart, TrendingUp, Globe,
    Handshake, Calendar
} from 'lucide-react';
import Navbar from './Navbar';
import { usePageStyle } from '../context/PageStyleContext';
import './pages-dark.css';

/* ─── Nature (dark) version ─────────────────────────────────── */
const AboutNature = () => (
    <div className="dark-page">
        <div className="dp-blob dp-blob-1" />
        <div className="dp-blob dp-blob-2" />

        {/* Header */}
        <div className="dp-header">
            <div className="dp-header-tag"><span className="dot" />О компании</div>
            <h1>CuratioPharm — <em>это мы</em></h1>
            <p>Ведущий дистрибьютор фармацевтической продукции в Республике Узбекистан</p>
        </div>

        {/* Who we are */}
        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-grid-2" style={{ alignItems: 'start', gap: '48px' }}>
                    <div>
                        <div className="dp-tag">Кто мы</div>
                        <h2 className="dp-section-title" style={{ textAlign: 'left', marginBottom: 20 }}>
                            Институциональный дистрибьютор
                        </h2>
                        <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: 16 }}>
                            <strong style={{ color: '#e2e8f0' }}>МЧХЖ «Curatio Pharm»</strong> — институциональный
                            импортер и ведущий дистрибьютор фармацевтической продукции в Республике Узбекистан.
                            С годовым оборотом, превышающим <strong style={{ color: '#6ee7b7' }}>$34,8 млн</strong>,
                            мы являемся фундаментальным связующим звеном между глобальными производителями и
                            системой здравоохранения страны.
                        </p>
                        <p style={{ color: '#94a3b8', lineHeight: 1.8 }}>
                            Компания оперирует в строгом соответствии с международными стандартами качества
                            <strong style={{ color: '#e2e8f0' }}> GDP (Good Distribution Practice)</strong>. Мы
                            тесно сотрудничаем с международными партнерами, включая
                            <strong style={{ color: '#e2e8f0' }}> Delfield Marketing Limited</strong>.
                        </p>
                    </div>
                    <div className="dp-grid-2" style={{ gap: 16 }}>
                        {[
                            { icon: <History size={24} />, num: '$34.8M+', label: 'Годовой оборот' },
                            { icon: <Users size={24} />, num: '1200+', label: 'Клиентов' },
                            { icon: <Trophy size={24} />, num: 'GDP', label: 'Стандарт' },
                            { icon: <Calendar size={24} />, num: '15+', label: 'Лет на рынке' },
                        ].map((s, i) => (
                            <div key={i} className="dp-glass-card" style={{ padding: 24, textAlign: 'center' }}>
                                <div className="dp-icon" style={{ margin: '0 auto 12px' }}>{s.icon}</div>
                                <div className="dp-stat-num" style={{ fontSize: '1.8rem' }}>{s.num}</div>
                                <div className="dp-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* History */}
        <section className="dp-section dp-section-alt">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>История</div>
                <h2 className="dp-section-title">Путь развития</h2>
                <p className="dp-section-subtitle">Как CuratioPharm стал лидером рынка</p>
                <div className="dp-timeline">
                    {[
                        { year: '2008', title: 'Основание компании', text: 'Группа специалистов основала компанию. Начали работу с небольшого склада и штатом из 5 человек.' },
                        { year: '2012', title: 'Расширение географии', text: 'Открытие филиалов в ключевых регионах. Расширение склада до 2 000 кв.м.' },
                        { year: '2016', title: 'Сертификация GDP', text: 'Получение сертификата надлежащей дистрибьюторской практики и внедрение системы контроля качества.' },
                        { year: '2020', title: 'Цифровая трансформация', text: 'Запуск IT-инфраструктуры, личного кабинета и системы автоматизации заказов.' },
                        { year: 'Сегодня', title: 'Лидер отрасли', text: 'Более 5 000 наименований, 1 200+ клиентов, доставка в 7+ регионов Узбекистана.' },
                    ].map((item, i) => (
                        <div key={i} className="dp-timeline-item">
                            <div className="dp-timeline-year"><Calendar size={14} /> {item.year}</div>
                            <div className="dp-timeline-title">{item.title}</div>
                            <div className="dp-timeline-text">{item.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Team */}
        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>Команда</div>
                <h2 className="dp-section-title">Наша команда</h2>
                <p className="dp-section-subtitle">Профессионалы, на которых можно положиться</p>
                <div className="dp-grid-4" style={{ marginBottom: 40 }}>
                    {[
                        { num: '85+', label: 'Сотрудников', desc: 'Профессиональная команда' },
                        { num: '12', label: 'Менеджеров', desc: 'Персональный подход' },
                        { num: '25', label: 'Водителей', desc: 'Собственный автопарк' },
                        { num: '8', label: 'Провизоров', desc: 'Контроль качества' },
                    ].map((s, i) => (
                        <div key={i} className="dp-glass-card" style={{ textAlign: 'center' }}>
                            <div className="dp-stat-num">{s.num}</div>
                            <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6, fontSize: '0.9rem' }}>{s.label}</div>
                            <div className="dp-stat-label">{s.desc}</div>
                        </div>
                    ))}
                </div>
                <div className="dp-grid-3">
                    {[
                        { icon: <Briefcase size={24} />, title: 'Отдел продаж', text: 'Консультации и оформление заказов' },
                        { icon: <GraduationCap size={24} />, title: 'Отдел качества', text: 'Контроль и сертификация' },
                        { icon: <Heart size={24} />, title: 'Служба поддержки', text: 'Помощь клиентам 24/7' },
                    ].map((d, i) => (
                        <div key={i} className="dp-glass-card">
                            <div className="dp-icon">{d.icon}</div>
                            <div className="dp-card-title">{d.title}</div>
                            <p className="dp-card-text">{d.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Goals */}
        <section className="dp-section dp-section-alt">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>Стратегия</div>
                <h2 className="dp-section-title">Наши цели</h2>
                <p className="dp-section-subtitle">Стратегические направления развития</p>
                <div className="dp-grid-3">
                    {[
                        { icon: <TrendingUp size={24} />, title: 'Рост ассортимента', text: 'Расширение каталога до 10 000 наименований.', pct: 50 },
                        { icon: <Globe size={24} />, title: 'География присутствия', text: 'Охват всех регионов Узбекистана.', pct: 70 },
                        { icon: <Handshake size={24} />, title: 'Партнерская сеть', text: 'Развитие отношений с 2000+ клиентами.', pct: 60 },
                    ].map((g, i) => (
                        <div key={i} className="dp-glass-card">
                            <div className="dp-icon">{g.icon}</div>
                            <div className="dp-card-title">{g.title}</div>
                            <p className="dp-card-text" style={{ marginBottom: 16 }}>{g.text}</p>
                            <div className="dp-progress-wrap">
                                <div className="dp-progress-bar">
                                    <div className="dp-progress-fill" style={{ width: `${g.pct}%` }} />
                                </div>
                                <span className="dp-progress-label">{g.pct}% выполнено</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Values */}
        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-grid-3">
                    {[
                        { icon: <Building2 size={24} />, title: 'Наша компания', text: 'Команда профессионалов с многолетним опытом в фармацевтической отрасли.' },
                        { icon: <Target size={24} />, title: 'Наша миссия', text: 'Обеспечить доступность качественных лекарственных средств для каждого жителя Узбекистана.' },
                        { icon: <Award size={24} />, title: 'Наши ценности', text: 'Качество, надёжность и ответственность — основа нашей работы.' },
                    ].map((v, i) => (
                        <div key={i} className="dp-glass-card featured">
                            <div className="dp-icon">{v.icon}</div>
                            <div className="dp-card-title">{v.title}</div>
                            <p className="dp-card-text">{v.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Licenses */}
        <section className="dp-section dp-section-alt">
            <div className="dp-container">
                <h2 className="dp-section-title">Лицензии и сертификаты</h2>
                <div className="dp-divider" />
                <div className="dp-grid-3">
                    {[
                        { title: 'Лицензия на фарм. деятельность', text: '№ ЛО-77-02-010123 от 01.01.2020' },
                        { title: 'Сертификат ISO 9001:2015', text: 'Система менеджмента качества' },
                        { title: 'Сертификат GDP', text: 'Надлежащая дистрибьюторская практика' },
                    ].map((l, i) => (
                        <div key={i} className="dp-glass-card" style={{ textAlign: 'center' }}>
                            <div className="dp-tag" style={{ margin: '0 auto 12px', display: 'flex', width: 'fit-content' }}>
                                Документ
                            </div>
                            <div className="dp-card-title">{l.title}</div>
                            <p className="dp-card-text">{l.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

/* ─── Classic (original) version ─────────────────────────────── */
const AboutClassic = () => (
    <main className="page-content">
        <section className="page-header">
            <div className="container">
                <h1>О Компании</h1>
                <p>Узнайте больше о CuratioPharm</p>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <div className="about-full-grid">
                    <div className="about-text">
                        <h2>Кто мы</h2>
                        <p><strong>МЧХЖ «Curatio Pharm»</strong> — институциональный импортер и ведущий дистрибьютор фармацевтической продукции в Республике Узбекистан. С годовым оборотом, превышающим <strong>$34,8 миллиона</strong>, мы являемся фундаментальным связующим звеном между глобальными производителями и системой здравоохранения страны.</p>
                        <p>Компания оперирует в строгом соответствии с международными стандартами качества <strong>GDP</strong>. Мы тесно сотрудничаем с международными партнерами, включая <strong>Delfield Marketing Limited</strong>.</p>
                    </div>
                    <div className="about-stats">
                        <div className="about-stat"><History size={32} /><div><strong>$34.8M+</strong><span>Годовой оборот</span></div></div>
                        <div className="about-stat"><Users size={32} /><div><strong>1200+</strong><span>клиентов</span></div></div>
                        <div className="about-stat"><Trophy size={32} /><div><strong>GDP</strong><span>стандарт</span></div></div>
                    </div>
                </div>
            </div>
        </section>
        <section className="section section-alt">
            <div className="container">
                <h2 className="section-title">История компании</h2>
                <p className="section-subtitle">Путь развития CuratioPharm</p>
                <div className="history-timeline">
                    {[
                        { year: '2008', title: 'Основание компании', text: 'Компания CuratioPharm была основана группой специалистов. Начали с небольшого склада.' },
                        { year: '2012', title: 'Расширение географии', text: 'Открытие филиалов в ключевых регионах Узбекистана.' },
                        { year: '2016', title: 'Сертификация GDP', text: 'Получение сертификата надлежащей дистрибьюторской практики.' },
                        { year: '2020', title: 'Цифровая трансформация', text: 'Запуск IT-инфраструктуры и личного кабинета.' },
                        { year: 'Сегодня', title: 'Лидер отрасли', text: 'Более 5000 наименований, 1200+ клиентов.' },
                    ].map((item, i) => (
                        <div key={i} className="history-item">
                            <div className="history-year"><Calendar size={20} /><span>{item.year}</span></div>
                            <div className="history-content"><h3>{item.title}</h3><p>{item.text}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <h2 className="section-title">Наша команда</h2>
                <p className="section-subtitle">Профессионалы, на которых можно положиться</p>
                <div className="team-stats">
                    <div className="team-stat-card"><div className="team-stat-number">85+</div><div className="team-stat-label">Сотрудников</div><div className="team-stat-desc">Профессиональная команда</div></div>
                    <div className="team-stat-card"><div className="team-stat-number">12</div><div className="team-stat-label">Менеджеров</div><div className="team-stat-desc">Персональный подход</div></div>
                    <div className="team-stat-card"><div className="team-stat-number">25</div><div className="team-stat-label">Водителей</div><div className="team-stat-desc">Собственный автопарк</div></div>
                    <div className="team-stat-card"><div className="team-stat-number">8</div><div className="team-stat-label">Провизоров</div><div className="team-stat-desc">Контроль качества</div></div>
                </div>
                <div className="team-departments">
                    <div className="department-card"><Briefcase size={28} /><h4>Отдел продаж</h4><p>Консультации и оформление заказов</p></div>
                    <div className="department-card"><GraduationCap size={28} /><h4>Отдел качества</h4><p>Контроль и сертификация</p></div>
                    <div className="department-card"><Heart size={28} /><h4>Служба поддержки</h4><p>Помощь клиентам 24/7</p></div>
                </div>
            </div>
        </section>
        <section className="section section-alt">
            <div className="container">
                <h2 className="section-title">Наши цели</h2>
                <p className="section-subtitle">Стратегические направления развития</p>
                <div className="goals-grid">
                    <div className="goal-card"><div className="goal-icon"><TrendingUp size={32} /></div><h3>Рост ассортимента</h3><p>Расширение каталога до 10 000 наименований.</p><div className="goal-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: '50%' }} /></div><span>50% выполнено</span></div></div>
                    <div className="goal-card"><div className="goal-icon"><Globe size={32} /></div><h3>География присутствия</h3><p>Охват всех регионов Узбекистана.</p><div className="goal-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: '70%' }} /></div><span>70% выполнено</span></div></div>
                    <div className="goal-card"><div className="goal-icon"><Handshake size={32} /></div><h3>Партнерская сеть</h3><p>Развитие отношений с 2000+ клиентами.</p><div className="goal-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: '60%' }} /></div><span>60% выполнено</span></div></div>
                </div>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <div className="values-grid">
                    <div className="value-card"><div className="icon-wrapper"><Building2 size={32} /></div><h3>Наша Компания</h3><p>Команда профессионалов с многолетним опытом.</p></div>
                    <div className="value-card"><div className="icon-wrapper"><Target size={32} /></div><h3>Наша Миссия</h3><p>Обеспечить доступность качественных лекарств для каждого.</p></div>
                    <div className="value-card"><div className="icon-wrapper"><Award size={32} /></div><h3>Наши Ценности</h3><p>Качество, надежность и ответственность.</p></div>
                </div>
            </div>
        </section>
        <section className="section section-alt">
            <div className="container">
                <h2 className="section-title">Лицензии и сертификаты</h2>
                <div className="licenses-grid">
                    <div className="license-card"><h4>Лицензия на фарм. деятельность</h4><p>№ ЛО-77-02-010123 от 01.01.2020</p></div>
                    <div className="license-card"><h4>Сертификат ISO 9001:2015</h4><p>Система менеджмента качества</p></div>
                    <div className="license-card"><h4>Сертификат GDP</h4><p>Надлежащая дистрибьюторская практика</p></div>
                </div>
            </div>
        </section>
    </main>
);

/* ─── Exported page ─────────────────────────────────────────── */
const AboutPage = () => {
    const { isNatureStyle } = usePageStyle();
    return (
        <>
            <Navbar />
            {isNatureStyle ? <AboutNature /> : <AboutClassic />}
        </>
    );
};

export default AboutPage;
