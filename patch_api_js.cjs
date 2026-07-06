const fs = require('fs');
const path = 'src/services/api.js';

let content = fs.readFileSync(path, 'utf8');

const target = `    async getProducts() {`;
const newMethods = `    async getOrders() {
        return callApi({ method: 'get', url: '/admin/orders', action: 'Ошибка загрузки заказов' });
    },
    async updateOrderStatus(id, status) {
        return callApi({ method: 'put', url: \`/admin/orders/\${id}/status\`, data: { status }, action: 'Ошибка изменения статуса' });
    },
    async createDocument(orderId, type) {
        return callApi({ method: 'post', url: \`/admin/orders/\${orderId}/document\`, data: { type }, action: 'Ошибка генерации документа' });
    },
    async getProducts() {`;

if (content.includes(target) && !content.includes('getOrders()')) {
    content = content.replace(target, newMethods);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Patched api.js successfully!');
} else {
    console.log('Target not found or already patched!');
}
