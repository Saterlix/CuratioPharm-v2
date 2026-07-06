const fs = require('fs');

const endpoints = `app.post('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  const product = {
    id: nextId('products'),
    guid: crypto.randomUUID(),
    name: req.body.name || 'Без названия',
    manufacturer: req.body.manufacturer || '',
    category: req.body.category || 'Общее',
    price: Number(req.body.price) || 0,
    stock: Number(req.body.stock) || 0,
    image_url: req.body.image_url || null,
    description: req.body.description || '',
    is_active: true,
    discount: Number(req.body.discount) || 0,
    discount_label: req.body.discount_label || null,
    created_at: new Date().toISOString()
  };
  db.products.push(product);
  logAction(req.user.id, 'create_product', null, 'Товар: ' + product.name);
  res.json(product);
});

app.put('/api/admin/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  
  if (req.body.name !== undefined) product.name = req.body.name;
  if (req.body.manufacturer !== undefined) product.manufacturer = req.body.manufacturer;
  if (req.body.category !== undefined) product.category = req.body.category;
  if (req.body.price !== undefined) product.price = Number(req.body.price) || 0;
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock) || 0;
  if (req.body.image_url !== undefined) product.image_url = req.body.image_url;
  if (req.body.description !== undefined) product.description = req.body.description;
  if (req.body.discount !== undefined) product.discount = Number(req.body.discount) || 0;
  if (req.body.discount_label !== undefined) product.discount_label = req.body.discount_label;
  if (req.body.isActive !== undefined) product.is_active = req.body.isActive;
  if (req.body.is_active !== undefined) product.is_active = req.body.is_active;

  logAction(req.user.id, 'update_product', null, 'Товар обновлен: ' + product.name);
  res.json(product);
});`;

function patchProductsLogic(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Create a regex that matches the old app.post and app.put blocks
    // Since PowerShell encoding might ruin the cyrillic matching, we use wildcards for cyrillic strings.
    const regex = /app\.post\('\/api\/admin\/products'[\s\S]*?res\.json\(product\);\n\}\);\n\napp\.put\('\/api\/admin\/products\/:id'[\s\S]*?res\.json\(product\);\n\}\);/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, endpoints);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Patched products logic in ' + filePath);
    } else {
        console.log('Target block not found in ' + filePath);
    }
}

patchProductsLogic('server.js');
patchProductsLogic('api/index.js');
