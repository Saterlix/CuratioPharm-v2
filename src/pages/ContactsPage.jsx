import React from 'react';
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import Navbar from './Navbar';
import { usePageStyle } from '../context/PageStyleContext';
import './pages-dark.css';

const googleMapSrc = 'https://maps.google.com/maps?q=OOO%20%22CURATIO%20PHARM%22,%20Ташкент&hl=ru&z=17&output=embed';
const googleMapLink = 'https://maps.app.goo.gl/Ag7zAbE6xLXeDWXcA';

const contacts = [
    { icon: <MapPin size={20} />, label: 'Наш адрес', lines: ['Республика Узбекистан, г. Ташкент', 'Юнус-абадский район, ул. Карим Зарипова, дом 3'] },
    { icon: <Navigation size={20} />, label: 'Ориентир', lines: ['Плюс-код Google: 9832+99 Ташкент'] },
    { icon: <Phone size={20} />, label: 'Телефон', lines: ['+998 71 207 88 99 — отдел продаж', '+998 71 207 01 52 — офис'] },
    { icon: <Mail size={20} />, label: 'Email', lines: ['info@cpharm.uz'] },
    { icon: <Clock size={20} />, label: 'Режим работы', lines: ['Пн–Пт: 09:00 – 18:00', 'Сб–Вс: выходные дни'] },
];

/* ─── Nature version ─────────────────────────────────────────── */
const ContactsNature = () => (
    <div className="dark-page">
        <div className="dp-blob dp-blob-1" />
        <div className="dp-blob dp-blob-2" />

        <div className="dp-header">
            <div className="dp-header-tag"><span className="dot" />Контакты</div>
            <h1>Свяжитесь <em>с нами</em></h1>
            <p>Приезжайте в офис или свяжитесь удобным способом — мы всегда рады помочь</p>
        </div>

        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-grid-2" style={{ alignItems: 'start', gap: 48 }}>
                    {/* Contact info */}
                    <div className="dp-glass-card">
                        <div className="dp-tag" style={{ marginBottom: 24 }}>Контактная информация</div>
                        {contacts.map((c, i) => (
                            <div key={i} className="dp-contact-block">
                                <div className="dp-contact-icon">{c.icon}</div>
                                <div>
                                    <div className="dp-contact-label">{c.label}</div>
                                    {c.lines.map((l, j) => (
                                        <p key={j} className="dp-contact-value">{l}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact form */}
                    <div className="dp-glass-card">
                        <div className="dp-tag" style={{ marginBottom: 16 }}>Оставить заявку</div>
                        <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.7 }}>
                            Заполните форму, и наш менеджер свяжется с вами в течение рабочего дня.
                        </p>
                        <form>
                            <div className="dp-form-row">
                                <div className="dp-form-group">
                                    <label>Ваше имя *</label>
                                    <input type="text" placeholder="Иван Иванов" required />
                                </div>
                                <div className="dp-form-group">
                                    <label>Компания</label>
                                    <input type="text" placeholder="ООО Аптека" />
                                </div>
                            </div>
                            <div className="dp-form-row">
                                <div className="dp-form-group">
                                    <label>Email *</label>
                                    <input type="email" placeholder="email@example.com" required />
                                </div>
                                <div className="dp-form-group">
                                    <label>Телефон *</label>
                                    <input type="tel" placeholder="+998 (99) 123-45-67" required />
                                </div>
                            </div>
                            <div className="dp-form-group">
                                <label>Тема обращения</label>
                                <select>
                                    <option>Общий вопрос</option>
                                    <option>Сотрудничество</option>
                                    <option>Заказ продукции</option>
                                    <option>Техническая поддержка</option>
                                </select>
                            </div>
                            <div className="dp-form-group">
                                <label>Сообщение</label>
                                <textarea rows="4" placeholder="Опишите ваш вопрос..." />
                            </div>
                            <button type="submit" className="dp-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Отправить заявку
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <section className="dp-section dp-section-alt">
            <div className="dp-container">
                <h2 className="dp-section-title">Наше расположение</h2>
                <p className="dp-section-subtitle">Офис Curatio Pharm находится в Юнус-абадском районе Ташкента</p>
                <div className="dp-map-container" style={{ marginBottom: 24, position: 'relative' }}>
                    <iframe
                        src={googleMapSrc}
                        width="100%"
                        height="420"
                        frameBorder="0"
                        allowFullScreen
                        loading="lazy"
                        title="Curatio Pharm - ул. Карим Зарипова, дом 3, Ташкент"
                        style={{ display: 'block' }}
                    />
                    <a 
                        href={googleMapLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="dp-btn-primary" 
                        style={{ position: 'absolute', bottom: 20, right: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                    >
                        Открыть в Google Картах
                    </a>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                        { icon: <MapPin size={16} />, text: 'г. Ташкент, Юнус-абадский район, ул. Карим Зарипова, дом 3' },
                        { icon: <Navigation size={16} />, text: 'Плюс-код: 9832+99 Ташкент' },
                        { icon: <Clock size={16} />, text: 'Пн–Пт: 09:00 – 18:00' },
                    ].map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.9rem' }}>
                            <span style={{ color: '#6ee7b7' }}>{m.icon}</span> {m.text}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

/* ─── Classic version ────────────────────────────────────────── */
const ContactsClassic = () => (
    <main className="page-content">
        <section className="page-header">
            <div className="container">
                <h1>Контакты</h1>
                <p>Свяжитесь с нами удобным способом или приезжайте в офис Curatio Pharm</p>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <div className="contacts-page-grid">
                    <div className="contact-info-full">
                        <h3>Контактная информация</h3>
                        {contacts.map((c, i) => (
                            <div key={i} className="contact-block">
                                <div className="contact-icon-wrapper">{c.icon}</div>
                                <div>
                                    <h4>{c.label}</h4>
                                    {c.lines.map((l, j) => <p key={j}>{l}</p>)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="contact-form-full">
                        <h3>Оставить заявку</h3>
                        <p className="form-description">Заполните форму, и наш менеджер свяжется с вами в течение рабочего дня.</p>
                        <form>
                            <div className="form-row">
                                <div className="form-group"><label>Ваше имя *</label><input type="text" placeholder="Иван Иванов" required /></div>
                                <div className="form-group"><label>Компания</label><input type="text" placeholder="ООО Аптека" /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Email *</label><input type="email" placeholder="email@example.com" required /></div>
                                <div className="form-group"><label>Телефон *</label><input type="tel" placeholder="+998 (99) 123-45-67" required /></div>
                            </div>
                            <div className="form-group">
                                <label>Тема обращения</label>
                                <select>
                                    <option>Общий вопрос</option>
                                    <option>Сотрудничество</option>
                                    <option>Заказ продукции</option>
                                    <option>Техническая поддержка</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Сообщение</label><textarea rows="5" placeholder="Опишите ваш вопрос..." /></div>
                            <button type="submit" className="btn-primary btn-large">Отправить заявку</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
        <section className="section section-alt">
            <div className="container">
                <h2 className="section-title">Наше расположение</h2>
                <p className="section-subtitle">Офис Curatio Pharm находится в Юнус-абадском районе Ташкента.</p>
                <div className="map-container" style={{ position: 'relative' }}>
                    <iframe src={googleMapSrc} width="100%" height="450" frameBorder="0" allowFullScreen loading="lazy" title="Curatio Pharm на карте" />
                    <a 
                        href={googleMapLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-primary" 
                        style={{ position: 'absolute', bottom: 20, right: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                    >
                        Открыть в Google Картах
                    </a>
                </div>
                <div className="map-info">
                    <div className="map-info-item"><MapPin size={20} /><span>г. Ташкент, Юнус-абадский район, ул. Карим Зарипова, дом 3</span></div>
                    <div className="map-info-item"><Navigation size={20} /><span>Плюс-код: 9832+99 Ташкент</span></div>
                    <div className="map-info-item"><Clock size={20} /><span>Пн–Пт: 09:00 – 18:00</span></div>
                </div>
            </div>
        </section>
    </main>
);

/* ─── Exported page ─────────────────────────────────────────── */
const ContactsPage = () => {
    const { isNatureStyle } = usePageStyle();
    return (
        <>
            <Navbar />
            {isNatureStyle ? <ContactsNature /> : <ContactsClassic />}
        </>
    );
};

export default ContactsPage;
