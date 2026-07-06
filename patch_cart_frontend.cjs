const fs = require('fs');
const path = 'src/pages/ShoppingCartPage.jsx';

let content = fs.readFileSync(path, 'utf8');

// The warning block
const warningBlock = `
                                            <div className="item-total">
                                                <strong>{Number(item.total).toLocaleString()} сум</strong>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="remove-btn"
                                                disabled={updating}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        {item.quantity > (item.stock || 0) && (
                                            <div className="stock-warning-message" style={{
                                                backgroundColor: '#fef3c7', 
                                                color: '#d97706', 
                                                padding: '8px 12px', 
                                                borderRadius: '6px', 
                                                fontSize: '13px', 
                                                marginBottom: '16px',
                                                marginTop: '-8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                ⚠️ Запрошенное количество превышает остаток. Менеджер подтвердит наличие при обработке.
                                            </div>
                                        )}`;

if (content.includes('className="remove-btn"')) {
    content = content.replace(
        /<div className="item-total">[\s\S]*?<Trash2 size=\{18\} \/>\s*<\/button>\s*<\/div>/,
        warningBlock
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patched ShoppingCartPage.jsx warning');
