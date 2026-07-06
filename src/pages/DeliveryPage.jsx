import React from 'react';
import { Truck, Package, Thermometer, Clock, MapPin, Shield } from 'lucide-react';
import Navbar from './Navbar';
import { usePageStyle } from '../context/PageStyleContext';
import './pages-dark.css';

const features = [
    { icon: <Truck size={24} />, title: 'Быстрая доставка', text: 'Отправка заказов в течение 24 часов после подтверждения. Собственный автопарк для оперативной доставки в регионы.' },
    { icon: <Package size={24} />, title: 'Надежная упаковка', text: 'Специализированная тара для безопасной транспортировки медицинских препаратов.' },
    { icon: <Thermometer size={24} />, title: 'Температурный режим', text: 'Соблюдение холодовой цепи +2...+8°C для термолабильных препаратов. Рефрижераторный транспорт.' },
    { icon: <Clock size={24} />, title: 'Точно в срок', text: 'Четкое соблюдение сроков поставки. Отслеживание груза на всех этапах доставки.' },
    { icon: <MapPin size={24} />, title: 'Весь Узбекистан', text: 'Доставка в любой регион Узбекистана. Работаем с транспортными компаниями и собственной сетью.' },
    { icon: <Shield size={24} />, title: 'Страхование груза', text: 'Все грузы застрахованы. Полная материальная ответственность до момента передачи товара.' },
];

const terms = [
    { city: 'Ташкент и область', time: 'День в день', note: 'Бесплатная доставка от 5 000 000 сум' },
    { city: 'Самарканд, Бухара, Навои', time: '1–2 рабочих дня', note: 'Бесплатная доставка от 10 000 000 сум' },
    { city: 'Другие регионы', time: '2–3 рабочих дня', note: 'Стоимость рассчитывается индивидуально' },
];

/* ─── Nature version ─────────────────────────────────────────── */
const DeliveryNature = () => (
    <div className="dark-page">
        <div className="dp-blob dp-blob-1" />
        <div className="dp-blob dp-blob-2" />

        <div className="dp-header">
            <div className="dp-header-tag"><span className="dot" />Логистика</div>
            <h1>Доставка <em>день в день</em></h1>
            <p>Оперативная логистика по всему Узбекистану с соблюдением холодовой цепи</p>
        </div>

        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>Наши преимущества</div>
                <h2 className="dp-section-title">Почему нам доверяют</h2>
                <p className="dp-section-subtitle">6 причин выбрать CuratioPharm для доставки</p>
                <div className="dp-grid-3">
                    {features.map((f, i) => (
                        <div key={i} className="dp-glass-card">
                            <div className="dp-icon">{f.icon}</div>
                            <div className="dp-card-title">{f.title}</div>
                            <p className="dp-card-text">{f.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="dp-section dp-section-alt">
            <div className="dp-container">
                <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>Тарифы</div>
                <h2 className="dp-section-title">Условия доставки</h2>
                <div className="dp-divider" />
                <div className="dp-grid-3">
                    {terms.map((t, i) => (
                        <div key={i} className={`dp-glass-card ${i === 0 ? 'featured' : ''}`} style={{ textAlign: 'center' }}>
                            <div className="dp-tag" style={{ margin: '0 auto 16px', display: 'flex', width: 'fit-content' }}>{t.time}</div>
                            <div className="dp-card-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>{t.city}</div>
                            <p className="dp-card-text">{t.note}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

/* ─── Classic version ────────────────────────────────────────── */
const DeliveryClassic = () => (
    <main className="page-content">
        <section className="page-header">
            <div className="container">
                <h1>Доставка</h1>
                <p>Оперативная логистика по всему Узбекистану</p>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <div className="delivery-page-grid">
                    {features.map((f, i) => (
                        <div key={i} className="delivery-feature">
                            <div className="delivery-icon">{React.cloneElement(f.icon, { size: 40 })}</div>
                            <h3>{f.title}</h3>
                            <p>{f.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        <section className="section section-alt">
            <div className="container">
                <h2 className="section-title">Условия доставки</h2>
                <div className="terms-grid">
                    {terms.map((t, i) => (
                        <div key={i} className="term-card">
                            <h4>{t.city}</h4>
                            <p className="term-time">{t.time}</p>
                            <p>{t.note}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </main>
);

/* ─── Exported page ─────────────────────────────────────────── */
const DeliveryPage = () => {
    const { isNatureStyle } = usePageStyle();
    return (
        <>
            <Navbar />
            {isNatureStyle ? <DeliveryNature /> : <DeliveryClassic />}
        </>
    );
};

export default DeliveryPage;
