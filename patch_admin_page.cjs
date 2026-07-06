const fs = require('fs');
const path = require('path');

const adminJsxPath = path.join(__dirname, 'src/pages/AdminPage.jsx');
let content = fs.readFileSync(adminJsxPath, 'utf8');

// 1. Add state for orders and modal
if (!content.includes('const [orders, setOrders] = useState([]);')) {
    content = content.replace(
        "const [activeTab, setActiveTab] = useState('users');",
        "const [orders, setOrders] = useState([]);\n    const [showOrderModal, setShowOrderModal] = useState(false);\n    const [selectedOrder, setSelectedOrder] = useState(null);\n    const [activeTab, setActiveTab] = useState('users');"
    );
}

// 2. Add loading logic
if (!content.includes("if (activeTab === 'orders') setOrders")) {
    content = content.replace(
        "if (activeTab === 'catalog' && canManageCatalog) {\n                promises.push(adminAPI.getProducts());\n            }",
        "if (activeTab === 'catalog' && canManageCatalog) {\n                promises.push(adminAPI.getProducts());\n            } else if (activeTab === 'orders' && canManageCatalog) {\n                promises.push(adminAPI.getOrders());\n            }"
    );
    content = content.replace(
        "if (activeTab === 'catalog') setProducts(results[1].products || []);",
        "if (activeTab === 'catalog') setProducts(results[1].products || []);\n                if (activeTab === 'orders') setOrders(results[1] || []);"
    );
}

// 3. Add handleOrderActions
if (!content.includes("const handleUpdateOrderStatus")) {
    const orderActions = `
    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            await adminAPI.updateOrderStatus(orderId, status);
            setSuccessMessage('Статус заказа обновлен');
            loadData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCreateDocument = async (orderId, type) => {
        try {
            await adminAPI.createDocument(orderId, type);
            setSuccessMessage('Документ успешно сгенерирован');
            loadData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };
    
    // Filtering
`;
    content = content.replace("// Filtering", orderActions);
}

// 4. Add Tab button
if (!content.includes("onClick={() => setActiveTab('orders')}")) {
    const tabCode = `
                            {canManageCatalog && (
                                <button 
                                    className={\`admin-tab \${activeTab === 'orders' ? 'active' : ''}\`}
                                    onClick={() => setActiveTab('orders')}
                                >
                                    <Package size={18} />
                                    Заказы
                                </button>
                            )}
                        </div>`;
    content = content.replace("</div>\n\n                        {/* Toolbar */}", tabCode + "\n\n                        {/* Toolbar */}");
}

// 5. Add Search placeholder
if (!content.includes("activeTab === 'orders' ? \"Поиск заказов...\"")) {
    content = content.replace(
        "placeholder={activeTab === 'users' ? \"Поиск пользователей...\" : \"Поиск товаров...\"}",
        "placeholder={activeTab === 'users' ? \"Поиск пользователей...\" : activeTab === 'orders' ? \"Поиск заказов...\" : \"Поиск товаров...\"}"
    );
}

// 6. Add Orders Table content
if (!content.includes("activeTab === 'orders' && canManageCatalog && (")) {
    const ordersTable = `
                                {activeTab === 'orders' && canManageCatalog && (
                                    <table className="users-table">
                                        <thead>
                                            <tr>
                                                <th>Номер</th>
                                                <th>Клиент</th>
                                                <th>Дата</th>
                                                <th>Сумма</th>
                                                <th>Статус</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.filter(o => o.order_number?.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
                                                <tr key={order.id}>
                                                    <td><strong>{order.order_number}</strong></td>
                                                    <td>
                                                        <div className="user-cell">
                                                            <span className="user-name">{order.user?.companyName || 'Неизвестно'}</span>
                                                            <span className="user-email">{order.user?.email || ''}</span>
                                                        </div>
                                                    </td>
                                                    <td>{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                                                    <td>{Number(order.total_amount || 0).toLocaleString()} UZS</td>
                                                    <td>
                                                        <span className={\`status-badge \${order.status}\`}>
                                                            {order.status === 'pending' && 'Ожидает'}
                                                            {order.status === 'processing' && 'В обработке'}
                                                            {order.status === 'shipped' && 'Отправлен'}
                                                            {order.status === 'delivered' && 'Доставлен'}
                                                            {order.status === 'cancelled' && 'Отменен'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button className="action-btn view" title="Детали" onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}>
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                                                        Заказов не найдено
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                                
                                {activeTab === 'catalog' && canManageCatalog && (`;
    
    content = content.replace("{activeTab === 'catalog' && canManageCatalog && (", ordersTable);
}

// 7. Add Modal logic at the end
if (!content.includes("showOrderModal && selectedOrder")) {
    const modalCode = `
            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal-content order-modal">
                        <div className="modal-header">
                            <h2>Заказ {selectedOrder.order_number}</h2>
                            <button className="close-btn" onClick={() => setShowOrderModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="order-details-info">
                                <p><strong>Клиент:</strong> {selectedOrder.user?.companyName}</p>
                                <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
                                <p><strong>Дата:</strong> {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}</p>
                                <p><strong>Статус:</strong> {selectedOrder.status}</p>
                            </div>
                            
                            <h3>Позиции:</h3>
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Цена</th>
                                        <th>Кол-во</th>
                                        <th>Итого</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.productName || item.product_id}</td>
                                            <td>{Number(item.price || 0).toLocaleString()} UZS</td>
                                            <td>{item.quantity} шт</td>
                                            <td>{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()} UZS</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <h3 style={{marginTop: '20px', textAlign: 'right'}}>Итого: {Number(selectedOrder.total_amount || 0).toLocaleString()} UZS</h3>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                            <div className="order-actions-left">
                                {selectedOrder.status === 'pending' && (
                                    <>
                                        <button className="btn-primary" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'processing'); setShowOrderModal(false); }}>
                                            <Check size={16} /> Принять в работу
                                        </button>
                                        <button className="btn-danger" style={{marginLeft: '10px'}} onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'cancelled'); setShowOrderModal(false); }}>
                                            <X size={16} /> Отклонить
                                        </button>
                                    </>
                                )}
                                {selectedOrder.status === 'processing' && (
                                    <>
                                        <button className="btn-secondary" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'shipped'); setShowOrderModal(false); }}>
                                            Отметить как отправленный
                                        </button>
                                        <button className="btn-primary" style={{marginLeft: '10px'}} onClick={() => { handleCreateDocument(selectedOrder.id, 'invoice'); setShowOrderModal(false); }}>
                                            <FileText size={16} /> Сгенерировать счет
                                        </button>
                                    </>
                                )}
                            </div>
                            <button type="button" className="btn-secondary" onClick={() => setShowOrderModal(false)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </>
    );`;
    // Find the last `</>\n    );`
    content = content.replace(/<\/>\s*\);\s*};\s*export default AdminPage;/g, modalCode + "\n};\n\nexport default AdminPage;");
    
    // We also need FileText icon
    if (!content.includes('FileText,')) {
        content = content.replace("Package,", "Package,\n    FileText,");
    }
}

fs.writeFileSync(adminJsxPath, content, 'utf8');
console.log('Patched AdminPage.jsx');
