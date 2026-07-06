import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Beaker, PackageCheck, Pill, ShieldCheck, Lock, Eye } from 'lucide-react';
import Navbar from './Navbar';
import { usePageStyle } from '../context/PageStyleContext';
import './pages-dark.css';

const testProducts = [
    { icon: Pill,         name: 'Амоксициллин 500 мг', category: 'Антибиотики',    note: 'Тестовый пример карточки лекарственного препарата для демонстрации каталога.' },
    { icon: Beaker,       name: 'Витамин C 1000 мг',   category: 'Витамины',       note: 'Пример позиции с категорией, производителем и остатком на складе.' },
    { icon: ShieldCheck,  name: 'Омепразол 20 мг',     category: 'ЖКТ',            note: 'Демонстрационная карточка для проверки поиска и фильтрации.' },
    { icon: PackageCheck, name: 'Лоратадин 10 мг',     category: 'Антигистаминные',note: 'Тестовая позиция, не является публичным прайс-листом компании.' },
];

/* ─── Dark version ───────────────────────────────────────────── */
const ProductsDark = () => (
    <div className="dark-page">
        <div className="dp-blob dp-blob-1" />
        <div className="dp-blob dp-blob-2" />

        {/* Header */}
        <div className="dp-header">
            <div className="dp-header-tag"><BadgeCheck size={14} /> Демонстрационный раздел</div>
            <h1>Наша <em>продукция</em></h1>
            <p>
                Здесь показаны только тестовые примеры товарных карточек.
                Реальный ассортимент и оформление заказов доступны после регистрации.
            </p>
        </div>

        {/* Notice */}
        <section className="dp-section">
            <div className="dp-container">
                <div className="dp-glass-card featured" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div className="dp-icon" style={{ marginBottom: 0, flexShrink: 0 }}><Lock size={22} /></div>
                        <div>
                            <div className="dp-card-title" style={{ fontSize: '1.1rem' }}>Это не публичный прайс-лист</div>
                            <p className="dp-card-text" style={{ maxWidth: 500 }}>
                                Примеры ниже нужны, чтобы показать структуру каталога: категории, карточки,
                                фильтрацию и общий формат. Для работы с реальными позициями — войдите или зарегистрируйтесь.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                        <Link to="/register" className="dp-btn-primary">Зарегистрироваться <ArrowRight size={16} /></Link>
                        <Link to="/login" className="dp-btn-outline">Войти</Link>
                    </div>
                </div>

                {/* Cards */}
                <div className="dp-grid-4">
                    {testProducts.map((product) => {
                        const Icon = product.icon;
                        return (
                            <div key={product.name} className="dp-glass-card">
                                <div className="dp-tag" style={{ marginBottom: 14 }}>Тестовый пример</div>
                                <div className="dp-icon"><Icon size={22} /></div>
                                <div className="dp-card-title">{product.name}</div>
                                <div style={{ fontSize: '0.78rem', color: '#6ee7b7', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{product.category}</div>
                                <p className="dp-card-text">{product.note}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="dp-section dp-section-alt">
            <div className="dp-container" style={{ maxWidth: 680, textAlign: 'center' }}>
                <div className="dp-icon" style={{ margin: '0 auto 20px' }}><Eye size={24} /></div>
                <h2 className="dp-section-title">Хотите увидеть реальный каталог?</h2>
                <p className="dp-section-subtitle" style={{ marginBottom: 36 }}>
                    После регистрации вы получите доступ к актуальной продукции, сможете добавлять
                    товары в корзину и отправлять заказы оператору прямо через сайт.
                </p>
                <Link to="/register" className="dp-btn-primary" style={{ fontSize: '1rem', padding: '15px 36px' }}>
                    Запросить регистрацию <ArrowRight size={18} />
                </Link>
            </div>
        </section>
    </div>
);

/* ─── Classic (light) version ────────────────────────────────── */
const ProductsClassic = () => (
    <main className="page-content">
        <section className="page-header products-test-header">
            <div className="container">
                <span className="test-products-eyebrow">
                    <BadgeCheck size={16} />
                    Демонстрационный раздел
                </span>
                <h1>Продукция</h1>
                <p>
                    Здесь показаны только тестовые примеры товарных карточек. Реальный ассортимент,
                    актуальные остатки и оформление заказов доступны после регистрации.
                </p>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="test-products-notice">
                    <div>
                        <h2>Это не публичный прайс-лист</h2>
                        <p>
                            Примеры ниже нужны, чтобы показать структуру каталога: категории, карточки,
                            фильтрацию и общий формат продукции. Для работы с реальными позициями
                            зарегистрируйтесь или войдите в личный кабинет.
                        </p>
                    </div>
                    <div className="test-products-actions">
                        <Link to="/register" className="btn-primary">
                            Зарегистрироваться <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn-secondary">
                            Войти в кабинет
                        </Link>
                    </div>
                </div>

                <div className="test-products-grid">
                    {testProducts.map((product) => {
                        const Icon = product.icon;
                        return (
                            <article className="test-product-card" key={product.name}>
                                <div className="test-product-icon"><Icon size={30} /></div>
                                <div className="test-product-content">
                                    <span className="test-product-label">Тестовый пример</span>
                                    <h3>{product.name}</h3>
                                    <p className="test-product-category">{product.category}</p>
                                    <p>{product.note}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>

        <section className="section section-alt">
            <div className="container cta-container">
                <h2>Хотите увидеть реальный каталог?</h2>
                <p>
                    После регистрации вы получите доступ к актуальной продукции, сможете добавлять товары
                    в корзину и отправлять заказы оператору прямо через сайт.
                </p>
                <Link to="/register" className="btn-primary btn-large">
                    Запросить регистрацию <ArrowRight size={20} />
                </Link>
            </div>
        </section>
    </main>
);

/* ─── Exported page ─────────────────────────────────────────── */
const ProductsPage = () => {
    const { isNatureStyle } = usePageStyle();
    return (
        <>
            <Navbar />
            {isNatureStyle ? <ProductsDark /> : <ProductsClassic />}
        </>
    );
};

export default ProductsPage;
