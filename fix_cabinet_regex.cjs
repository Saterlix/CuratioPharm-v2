const fs = require('fs');
const path = 'src/pages/CabinetPage.jsx';

let content = fs.readFileSync(path, 'utf8');

const regex = /<TrendingUp size=\{18\} className="widget-arrow" \/>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="cabinet-card" onClick=\{[^}]+\}>/;

const fixedSection = `<TrendingUp size={18} className="widget-arrow" />
                            </div>

                            <div className="summary-widget widget-orders" onClick={() => setActiveSection('orders')}>
                                <div className="widget-icon">
                                    <Package size={24} />
                                </div>
                                <div className="widget-info">
                                    <span className="widget-label">Заказы</span>
                                    <span className="widget-value">{orders ? orders.length : 0} шт</span>
                                </div>
                                <BarChart3 size={18} className="widget-arrow" />
                            </div>

                            <div className="summary-widget widget-cart" onClick={() => navigate('/cart')}>
                                <div className="widget-icon">
                                    <ShoppingCart size={24} />
                                </div>
                                <div className="widget-info">
                                    <span className="widget-label">Корзина</span>
                                    <span className="widget-value">{cart ? cart.totalItems : 0} позиций</span>
                                </div>
                                <ChevronRight size={18} className="widget-arrow" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container">
                        <div className="cabinet-grid">
                            {/* Catalog */}
                            <div className="cabinet-card" onClick={() => navigate('/catalog')}>
                                <div className="cabinet-card-icon"><ShoppingBag size={32} /></div>
                                <h3>Каталог</h3>
                                <p>Поиск и заказ лекарственных средств</p>
                            </div>

                            {/* Cart */}
                            <div className="cabinet-card" onClick={() => setActiveSection('cart')}>`;

if (regex.test(content)) {
    content = content.replace(regex, fixedSection);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed CabinetPage.jsx with regex!');
} else {
    console.log('Regex did not match!');
}
