import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Handshake, Building2, Truck, FileText, CheckCircle,
    ArrowRight, Users, Package, Clock, Shield, Send, Globe
} from 'lucide-react';
import { authAPI } from '../services/api';
import Navbar from './Navbar';
import { usePageStyle } from '../context/PageStyleContext';
import './pages-dark.css';

const useSupplierForm = () => {
    const [form, setForm] = useState({ company: '', contact: '', phone: '', email: '', products: '', message: '' });
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setStatus({ type: '', message: '' });
        try {
            const response = await authAPI.registerRequest(
                form.company, form.contact, form.phone, form.email,
                [form.products, form.message].filter(Boolean).join('\n')
            );
            setStatus({ type: 'success', message: response.message || 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.' });
            setForm({ company: '', contact: '', phone: '', email: '', products: '', message: '' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Не удалось отправить заявку. Попробуйте позже.' });
        } finally {
            setSending(false);
        }
    };

    return { form, setForm, sending, status, handleSubmit };
};

/* ─── Nature version ─────────────────────────────────────────── */
const CooperationNature = () => {
    const { form, setForm, sending, status, handleSubmit } = useSupplierForm();
    const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="dark-page">
            <div className="dp-blob dp-blob-1" />
            <div className="dp-blob dp-blob-2" />

            <div className="dp-header">
                <div className="dp-header-tag"><span className="dot" />Партнерство</div>
                <h1>Станьте нашим <em>партнёром</em></h1>
                <p>Вместе мы делаем качественные лекарства доступными для каждого</p>
            </div>

            {/* Forms of cooperation */}
            <section className="dp-section">
                <div className="dp-container">
                    <div className="dp-tag" style={{ margin: '0 auto 8px', display: 'flex', width: 'fit-content' }}>Форматы</div>
                    <h2 className="dp-section-title">Формы сотрудничества</h2>
                    <p className="dp-section-subtitle">Выберите подходящий вариант партнерства</p>
                    <div className="dp-grid-2">
                        <div className="dp-glass-card">
                            <div className="dp-icon"><Users size={24} /></div>
                            <div className="dp-card-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Для клиентов</div>
                            <p className="dp-card-text" style={{ marginBottom: 16 }}>Аптеки и медицинские учреждения</p>
                            <ul className="dp-benefits-list">
                                {['Личный кабинет с каталогом', 'Онлайн заказ и отслеживание', 'Индивидуальные условия', 'Доставка день в день'].map((b, i) => (
                                    <li key={i}><CheckCircle size={16} /> {b}</li>
                                ))}
                            </ul>
                            <div style={{ marginTop: 24 }}>
                                <Link to="/register" className="dp-btn-primary">Зарегистрироваться <ArrowRight size={16} /></Link>
                            </div>
                        </div>
                        <div className="dp-glass-card featured">
                            <div className="dp-tag" style={{ marginBottom: 12 }}>Рекомендуем</div>
                            <div className="dp-icon"><Handshake size={24} /></div>
                            <div className="dp-card-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Для поставщиков</div>
                            <p className="dp-card-text" style={{ marginBottom: 16 }}>Производители и дистрибьюторы</p>
                            <ul className="dp-benefits-list">
                                {['Широкая клиентская база', 'Профессиональное хранение', 'Маркетинговая поддержка', 'Прозрачная отчетность'].map((b, i) => (
                                    <li key={i}><CheckCircle size={16} /> {b}</li>
                                ))}
                            </ul>
                            <div style={{ marginTop: 24 }}>
                                <a href="#supplier-form" className="dp-btn-primary">Стать партнером <ArrowRight size={16} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why us */}
            <section className="dp-section dp-section-alt">
                <div className="dp-container">
                    <h2 className="dp-section-title">Почему стоит работать с нами</h2>
                    <div className="dp-divider" />
                    <div className="dp-grid-4">
                        {[
                            { icon: <Package size={24} />, num: '5000+', label: 'товаров' },
                            { icon: <Truck size={24} />, num: '7+', label: 'регионов' },
                            { icon: <Clock size={24} />, num: '15+', label: 'лет опыта' },
                            { icon: <Shield size={24} />, num: 'GDP', label: 'сертификат' },
                        ].map((b, i) => (
                            <div key={i} className="dp-glass-card" style={{ textAlign: 'center' }}>
                                <div className="dp-icon" style={{ margin: '0 auto 12px' }}>{b.icon}</div>
                                <div className="dp-stat-num" style={{ fontSize: '2rem' }}>{b.num}</div>
                                <div className="dp-stat-label">{b.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Strategic partner */}
            <section className="dp-section">
                <div className="dp-container" style={{ maxWidth: 700 }}>
                    <h2 className="dp-section-title">Стратегическое партнерство</h2>
                    <div className="dp-glass-card featured" style={{ textAlign: 'center', marginTop: 32 }}>
                        <div className="dp-icon" style={{ margin: '0 auto 16px' }}><Globe size={24} /></div>
                        <div className="dp-card-title" style={{ fontSize: '1.3rem', marginBottom: 12 }}>Delfield Marketing Limited</div>
                        <p className="dp-card-text">Наш ключевой международный партнер. Совместно мы реализуем стратегию по выводу на рынок Узбекистана инновационных лекарственных средств и обеспечению их доступности для населения.</p>
                    </div>
                </div>
            </section>

            {/* Supplier form */}
            <section className="dp-section dp-section-alt" id="supplier-form">
                <div className="dp-container">
                    <div className="dp-grid-2" style={{ alignItems: 'start', gap: 48 }}>
                        <div>
                            <div className="dp-tag" style={{ marginBottom: 16 }}>Для поставщиков</div>
                            <h2 className="dp-section-title" style={{ textAlign: 'left', marginBottom: 16 }}>Станьте нашим поставщиком</h2>
                            <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: 32 }}>Заполните форму, и мы свяжемся с вами для обсуждения условий сотрудничества</p>
                            <div>
                                <div className="dp-contact-block">
                                    <div className="dp-contact-icon"><FileText size={20} /></div>
                                    <div>
                                        <div className="dp-contact-label">Коммерческий отдел</div>
                                        <p className="dp-contact-value">+998 71 207-88-99</p>
                                    </div>
                                </div>
                                <div className="dp-contact-block">
                                    <div className="dp-contact-icon"><Building2 size={20} /></div>
                                    <div>
                                        <div className="dp-contact-label">Email для партнеров</div>
                                        <p className="dp-contact-value">partners@cpharm.uz</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {status.message && (
                                <div className={`dp-status ${status.type}`}>{status.message}</div>
                            )}
                            <div className="dp-form-group">
                                <label>Название компании *</label>
                                <input type="text" required value={form.company} onChange={f('company')} placeholder="ООО «Ваша компания»" />
                            </div>
                            <div className="dp-form-row">
                                <div className="dp-form-group">
                                    <label>Контактное лицо *</label>
                                    <input type="text" required value={form.contact} onChange={f('contact')} placeholder="Иван Иванов" />
                                </div>
                                <div className="dp-form-group">
                                    <label>Телефон *</label>
                                    <input type="tel" required value={form.phone} onChange={f('phone')} placeholder="+998 (99) 123-45-67" />
                                </div>
                            </div>
                            <div className="dp-form-group">
                                <label>Email *</label>
                                <input type="email" required value={form.email} onChange={f('email')} placeholder="email@company.com" />
                            </div>
                            <div className="dp-form-group">
                                <label>Категории продукции</label>
                                <input type="text" value={form.products} onChange={f('products')} placeholder="Лекарственные средства, БАДы..." />
                            </div>
                            <div className="dp-form-group">
                                <label>Сообщение</label>
                                <textarea rows="4" value={form.message} onChange={f('message')} placeholder="Дополнительная информация" />
                            </div>
                            <button type="submit" className="dp-btn-primary" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
                                <Send size={18} />
                                {sending ? 'Отправка...' : 'Отправить заявку'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

/* ─── Classic version ────────────────────────────────────────── */
const CooperationClassic = () => {
    const { form, setForm, sending, status, handleSubmit } = useSupplierForm();
    const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <main className="page-content">
            <section className="page-header">
                <div className="container">
                    <h1>Сотрудничество</h1>
                    <p>Станьте нашим партнером</p>
                </div>
            </section>
            <section className="section">
                <div className="container">
                    <h2 className="section-title">Формы сотрудничества</h2>
                    <p className="section-subtitle">Выберите подходящий вариант партнерства</p>
                    <div className="cooperation-cards">
                        <div className="cooperation-card">
                            <div className="cooperation-icon"><Users size={40} /></div>
                            <h3>Для клиентов</h3>
                            <p>Аптеки и медицинские учреждения</p>
                            <ul className="cooperation-benefits">
                                <li><CheckCircle size={18} /> Личный кабинет с каталогом</li>
                                <li><CheckCircle size={18} /> Онлайн заказ и отслеживание</li>
                                <li><CheckCircle size={18} /> Индивидуальные условия</li>
                                <li><CheckCircle size={18} /> Доставка день в день</li>
                            </ul>
                            <Link to="/register" className="btn-primary">Зарегистрироваться <ArrowRight size={18} /></Link>
                        </div>
                        <div className="cooperation-card featured">
                            <div className="cooperation-badge">Для поставщиков</div>
                            <div className="cooperation-icon"><Handshake size={40} /></div>
                            <h3>Для поставщиков</h3>
                            <p>Производители и дистрибьюторы</p>
                            <ul className="cooperation-benefits">
                                <li><CheckCircle size={18} /> Широкая клиентская база</li>
                                <li><CheckCircle size={18} /> Профессиональное хранение</li>
                                <li><CheckCircle size={18} /> Маркетинговая поддержка</li>
                                <li><CheckCircle size={18} /> Прозрачная отчетность</li>
                            </ul>
                            <a href="#supplier-form" className="btn-primary">Стать партнером <ArrowRight size={18} /></a>
                        </div>
                    </div>
                </div>
            </section>
            <section className="section section-alt">
                <div className="container">
                    <h2 className="section-title">Почему стоит работать с нами</h2>
                    <div className="partner-benefits-grid">
                        <div className="partner-benefit"><Package size={32} /><h4>5000+ товаров</h4><p>Широкий ассортимент</p></div>
                        <div className="partner-benefit"><Truck size={32} /><h4>7+ регионов</h4><p>Доставка по всему Узбекистану</p></div>
                        <div className="partner-benefit"><Clock size={32} /><h4>15+ лет опыта</h4><p>Надежный партнер</p></div>
                        <div className="partner-benefit"><Shield size={32} /><h4>GDP сертификат</h4><p>Соответствие стандартам</p></div>
                    </div>
                </div>
            </section>
            <section className="section" id="supplier-form">
                <div className="container">
                    <div className="supplier-form-wrapper">
                        <div className="supplier-form-info">
                            <h2>Станьте нашим поставщиком</h2>
                            <p>Заполните форму, и мы свяжемся с вами</p>
                            <div className="supplier-contacts">
                                <div className="supplier-contact-item"><FileText size={24} /><div><strong>Коммерческий отдел</strong><span>+998 71 207-88-99</span></div></div>
                                <div className="supplier-contact-item"><Building2 size={24} /><div><strong>Email для партнеров</strong><span>partners@cpharm.uz</span></div></div>
                            </div>
                        </div>
                        <form className="supplier-form" onSubmit={handleSubmit}>
                            {status.message && <div className={`form-status ${status.type}`}>{status.message}</div>}
                            <div className="form-group"><label>Название компании *</label><input type="text" required value={form.company} onChange={f('company')} placeholder="ООО «Ваша компания»" /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Контактное лицо *</label><input type="text" required value={form.contact} onChange={f('contact')} placeholder="Иван Иванов" /></div>
                                <div className="form-group"><label>Телефон *</label><input type="tel" required value={form.phone} onChange={f('phone')} placeholder="+998 (99) 123-45-67" /></div>
                            </div>
                            <div className="form-group"><label>Email *</label><input type="email" required value={form.email} onChange={f('email')} placeholder="email@company.ru" /></div>
                            <div className="form-group"><label>Категории продукции</label><input type="text" value={form.products} onChange={f('products')} placeholder="Лекарственные средства, БАДы..." /></div>
                            <div className="form-group"><label>Сообщение</label><textarea rows="4" value={form.message} onChange={f('message')} placeholder="Дополнительная информация" /></div>
                            <button type="submit" className="btn-primary btn-large" disabled={sending}><Send size={20} />{sending ? 'Отправка...' : 'Отправить заявку'}</button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
};

/* ─── Exported page ─────────────────────────────────────────── */
const CooperationPage = () => {
    const { isNatureStyle } = usePageStyle();
    return (
        <>
            <Navbar />
            {isNatureStyle ? <CooperationNature /> : <CooperationClassic />}
        </>
    );
};

export default CooperationPage;
