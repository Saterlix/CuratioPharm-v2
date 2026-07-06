const fs = require('fs');

const serverPath = 'server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Update /api/cart to include stock
const oldGetCart = `app.get('/api/cart', authenticateToken, (req, res) => {
  res.json(db.cart_items.filter(c => c.user_id === req.user.id));
});`;

const newGetCart = `app.get('/api/cart', authenticateToken, (req, res) => {
  const items = db.cart_items.filter(c => c.user_id === req.user.id).map(item => {
      const product = db.products.find(p => p.id === item.product_id);
      return { ...item, stock: product ? product.stock : 0 };
  });
  
  const cartInfo = {
      items,
      totalItems: items.length,
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  };
  
  // Try to return the format the frontend expects (success: true, items: [...])
  // Wait, frontend loadCart expects data.success or just data. Let's return { success: true, ...cartInfo } 
  // Let's check existing API responses - usually just returns the array or object. 
  // ShoppingCartPage expects cart.items and cart.totalItems and cart.total.
  res.json({ success: true, ...cartInfo });
});`;

if (content.includes("res.json(db.cart_items.filter(c => c.user_id === req.user.id));")) {
    content = content.replace(oldGetCart, newGetCart);
}

// 2. Settings state and logic
if (!content.includes('db.settings =')) {
    content = content.replace("cart_items: [],", "cart_items: [],\n  settings: { auto_deduct_stock: false },");
}

if (!content.includes('/api/admin/settings')) {
    const settingsApi = `
app.get('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
    res.json(db.settings);
});

app.put('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    res.json(db.settings);
});
`;
    // Insert after /api/admin/stats
    content = content.replace("app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {", settingsApi + "\napp.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {");
}

// 3. Update Order Status to deduct stock if auto_deduct_stock is true
const oldOrderStatus = `Object.assign(order, req.body);`;
if (content.includes(oldOrderStatus) && !content.includes('// Auto deduct stock logic')) {
    const newOrderStatus = `Object.assign(order, req.body);
  
  // Auto deduct stock logic
  if (req.body.status === 'processing' && db.settings.auto_deduct_stock && !order.stock_deducted) {
      const items = db.order_items.filter(i => i.order_id === order.id);
      items.forEach(item => {
          const product = db.products.find(p => p.id === item.product_id);
          if (product) {
              product.stock = Math.max(0, product.stock - item.quantity);
          }
      });
      order.stock_deducted = true;
  }`;
    content = content.replace(oldOrderStatus, newOrderStatus);
}

fs.writeFileSync(serverPath, content, 'utf8');
console.log('Patched server.js for cart and settings');
