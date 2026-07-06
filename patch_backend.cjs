const fs = require('fs');

const endpoints = `
// ============================================================
//  ADMIN ORDERS
// ============================================================
app.get('/api/admin/orders', authenticateToken, requireAdmin, (req, res) => {
  const allOrders = db.orders.map(o => {
    const u = db.users.find(user => user.id === o.user_id);
    const items = db.order_items.filter(i => i.order_id === o.id);
    return { ...o, user: u ? sanitizeUser(u) : {}, items };
  });
  // Sort by date DESC
  allOrders.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(allOrders);
});

app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  
  order.status = req.body.status;
  
  // Send message to chat
  let conv = db.chat_conversations.find(c => c.user_id === order.user_id && c.status !== 'closed');
  if (conv && req.body.status !== 'pending') {
    const statusMap = { processing: 'принят в обработку', shipped: 'отправлен', delivered: 'доставлен', cancelled: 'отклонен' };
    const statusText = statusMap[req.body.status] || 'обновлен';
    const sysMsg = {
      id: nextId('chat_messages'), conversation_id: conv.id, sender_type: 'ai', sender_id: null,
      message: '🔔 Ваш заказ ' + order.order_number + ' ' + statusText + '.',
      created_at: new Date().toISOString()
    };
    db.chat_messages.push(sysMsg);
    conv.updated_at = new Date().toISOString();
  }
  
  logAction(req.user.id, 'update_order_status', order.user_id, 'Статус заказа ' + order.order_number + ': ' + order.status);
  res.json(order);
});

app.post('/api/admin/orders/:id/document', authenticateToken, requireAdmin, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  
  const doc = {
    id: nextId('documents'), user_id: order.user_id, type: req.body.type || 'invoice',
    number: 'DOC-' + Date.now().toString(36).toUpperCase(),
    date: new Date().toISOString(), amount: order.total_amount, status: 'unpaid',
    fileUrl: '/dummy-invoice.pdf', order_id: order.id
  };
  db.documents.push(doc);
  logAction(req.user.id, 'create_document', order.user_id, 'Документ ' + doc.number + ' для ' + order.order_number);
  res.json(doc);
});

// ============================================================
//  PRODUCTS ENDPOINTS
// ============================================================
`;

function patchFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    if (!content.includes('/api/admin/orders')) {
        content = content.replace(/\/\/ ============================================================\n\/\/  PRODUCTS ENDPOINTS\n\/\/ ============================================================/g, endpoints);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Patched ' + path);
    } else {
        console.log(path + ' already patched');
    }
}

patchFile('server.js');
patchFile('api/index.js');
