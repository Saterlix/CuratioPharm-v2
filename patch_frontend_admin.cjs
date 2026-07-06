const fs = require('fs');

const path = 'src/pages/AdminPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update productForm state
content = content.replace(
    /const \[productForm, setProductForm\] = useState\(\{[\s\S]*?category: ''\n    \}\);/,
    `const [productForm, setProductForm] = useState({
        name: '', manufacturer: '', price: '', stock: '', category: '', image_url: '', description: '', discount_label: ''
    });`
);

// 2. Update setProductForm in openProductModal
content = content.replace(
    /setProductForm\(\{[\s\S]*?category: product\.category\n            \}\);/,
    `setProductForm({
                name: product.name || '',
                manufacturer: product.manufacturer || '',
                price: product.price || '',
                stock: product.stock || '',
                category: product.category || '',
                image_url: product.image_url || '',
                description: product.description || '',
                discount_label: product.discount_label || ''
            });`
);

content = content.replace(
    /setProductForm\(\{ name: '', manufacturer: '', price: '', stock: '', category: '' \}\);/g,
    `setProductForm({ name: '', manufacturer: '', price: '', stock: '', category: '', image_url: '', description: '', discount_label: '' });`
);

// 3. Update the Product Modal UI
const oldModalUI = `<div className="form-group">
                                    <label>Название товара</label>
                                    <input 
                                        type="text" 
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Производитель</label>
                                        <input 
                                            type="text" 
                                            value={productForm.manufacturer}
                                            onChange={(e) => setProductForm({...productForm, manufacturer: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Категория</label>
                                        <input 
                                            type="text" 
                                            value={productForm.category}
                                            onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Цена (UZS)</label>
                                        <input 
                                            type="number" 
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Остаток (шт)</label>
                                        <input 
                                            type="number" 
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                                            required 
                                        />
                                    </div>
                                </div>`;

const newModalUI = `<div className="form-row">
                                    <div className="form-group">
                                        <label>Название товара</label>
                                        <input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Ссылка на картинку (URL)</label>
                                        <input type="url" placeholder="https://..." value={productForm.image_url} onChange={(e) => setProductForm({...productForm, image_url: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Производитель</label>
                                        <input type="text" value={productForm.manufacturer} onChange={(e) => setProductForm({...productForm, manufacturer: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Категория</label>
                                        <input type="text" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Цена (UZS)</label>
                                        <input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Остаток (шт)</label>
                                        <input type="number" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Бейджик (Хит, Скидка)</label>
                                        <input type="text" value={productForm.discount_label} onChange={(e) => setProductForm({...productForm, discount_label: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Описание</label>
                                    <textarea rows="3" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} />
                                </div>
                                {productForm.image_url && (
                                    <div className="form-group" style={{textAlign: 'center'}}>
                                        <img src={productForm.image_url} alt="Preview" style={{maxHeight: '120px', borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                                    </div>
                                )}`;

if (content.includes('value={productForm.manufacturer}')) {
    // This is a bit tricky, let's just replace the exact block if possible, or use indexOf.
    const startIdx = content.indexOf('<div className="form-group">\n                                    <label>Название товара</label>');
    const endIdx = content.indexOf('</div>\n                            <div className="modal-footer">', startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, startIdx) + newModalUI + '\n                            ' + content.substring(endIdx);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patched AdminPage.jsx forms!');
