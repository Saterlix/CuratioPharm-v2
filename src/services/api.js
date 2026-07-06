import axios from 'axios';
import { isBackofficeRole, isDeveloperRole } from '../utils/roles';

// API URL: same domain on Vercel, or localhost in dev
// Default to empty string for relative paths in prod, or specific dev server URL
const defaultApiUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3006/api';
const API_URL = import.meta.env.VITE_API_BASE_URL || defaultApiUrl;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Автоматически добавляем Токен к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Обработка ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if we are already on the login page to prevent infinite redirects
            const isLoginPage = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/cp-admin-');

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAdmin');

            if (!isLoginPage) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

const extractPath = (config = {}) => {
    if (!config.url) return '';
    try {
        const url = new URL(config.url, config.baseURL || window.location.origin);
        return url.pathname;
    } catch (e) {
        return config.url;
    }
};

export const formatApiError = (error, action = 'Ошибка запроса') => {
    if (!error) return action;
    if (error.code === 'ERR_NETWORK') {
        return `${action}: нет соединения с сервером (возможны технические работы)`;
    }
    const method = (error.config?.method || 'GET').toUpperCase();
    const path = extractPath(error.config);
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const detail = error.response?.data?.error || error.response?.data?.message;
    let message = `${action}: ${method} ${path || ''}`.trim();
    if (status) message += ` → ${status}${statusText ? ` ${statusText}` : ''}`;
    if (detail) message += ` — ${detail}`;
    if (!status && !detail && error.message) message += ` — ${error.message}`;
    return message;
};

const callApi = async ({ method = 'get', url, data, params, action }) => {
    try {
        const response = await api.request({ method, url, data, params });
        return response.data;
    } catch (error) {
        throw new Error(formatApiError(error, action));
    }
};

const normalizeProductList = (data) => {
    if (Array.isArray(data)) return { success: true, products: data };
    if (Array.isArray(data?.products)) return { success: true, ...data };
    return data;
};

const normalizeCart = (data) => {
    if (!Array.isArray(data)) return data;
    const items = data.map((item) => ({
        ...item,
        productName: item.productName || item.product_name,
        product_id: item.product_id || item.productId,
        total: Number(item.total ?? Number(item.price || 0) * Number(item.quantity || 0))
    }));
    return {
        success: true,
        items,
        totalItems: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        total: items.reduce((sum, item) => sum + Number(item.total || 0), 0)
    };
};

const normalizeOrderItem = (item) => ({
    ...item,
    productName: item.productName || item.product_name,
    productId: item.productId || item.product_id
});

const normalizeOrder = (order) => order ? ({
    ...order,
    orderNumber: order.orderNumber || order.order_number,
    totalAmount: order.totalAmount ?? order.total_amount,
    itemsCount: order.itemsCount ?? order.items_count,
    deliveryAddress: order.deliveryAddress || order.delivery_address,
    contactPhone: order.contactPhone || order.contact_phone,
    createdAt: order.createdAt || order.created_at,
    items: (order.items || []).map(normalizeOrderItem)
}) : order;

const normalizeOrders = (data) => {
    if (Array.isArray(data)) return { success: true, orders: data.map(normalizeOrder) };
    if (Array.isArray(data?.orders)) return { ...data, success: true, orders: data.orders.map(normalizeOrder) };
    if (data?.order) return { ...data, success: true, order: normalizeOrder(data.order) };
    return data;
};

// ============================================================
//  AUTH API
// ============================================================
export const authAPI = {
    // Обычный вход (для партнеров)
    async login(login, password) {
        try {
            const response = await api.post('/auth/login', { login, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                if (isBackofficeRole(response.data.user.role)) {
                    localStorage.setItem('isAdmin', 'true');
                }
            }
            return response.data;
        } catch (error) {
            throw new Error(formatApiError(error, 'Ошибка входа'));
        }
    },

    // Вход по одноразовому паролю (OTP)
    async loginOtp(code) {
        try {
            const response = await api.post('/auth/login-otp', { code });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                if (isBackofficeRole(response.data.user.role)) {
                    localStorage.setItem('isAdmin', 'true');
                }
            }
            return response.data;
        } catch (error) {
            throw new Error(formatApiError(error, 'Ошибка входа по OTP'));
        }
    },

    // Принудительная смена пароля после OTP
    async changePassword(new_password) {
        try {
            const response = await api.post('/auth/change-password', { new_password });
            // Update user in storage (must_change_password = false)
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.must_change_password = false;
            user.mustChangePassword = false;
            const updatedUser = response.data.user ? { ...response.data.user, must_change_password: false, mustChangePassword: false } : user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return response.data;
        } catch (error) {
            throw new Error(formatApiError(error, 'Ошибка смены пароля'));
        }
    },

    // Вход Админа
    async adminLogin(login, password, adminKey) {
        try {
            const secretUrl = import.meta.env.VITE_ADMIN_SECRET_URL || 'cp-admin-2024';
            const response = await api.post(`/admin/${secretUrl}/login`, { login, password, adminKey });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('isAdmin', 'true');
            }
            return response.data;
        } catch (error) {
            throw new Error(formatApiError(error, 'Ошибка входа администратора'));
        }
    },

    // Проверка токена
    async verifyToken() {
        try {
            const response = await api.post('/auth/verify');
            if (response.data.valid === true && response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                if (isBackofficeRole(response.data.user.role)) {
                    localStorage.setItem('isAdmin', 'true');
                } else {
                    localStorage.removeItem('isAdmin');
                }
            }
            return response.data.valid === true;
        } catch (error) {
            return false;
        }
    },

    // Получить сохранённого пользователя
    getStoredUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    // Проверка роли админа
    isAdmin() {
        const user = this.getStoredUser();
        return user && isBackofficeRole(user.role);
    },

    // Проверка роли разработчика
    isDeveloper() {
        const user = this.getStoredUser();
        return user && isDeveloperRole(user.role);
    },

    // Заявка на регистрацию
    // Полноценная регистрация
    async register(data) {
        try {
            const response = await api.post('/auth/register', data);
            return response.data;
        } catch (error) {
            throw new Error(formatApiError(error, 'Ошибка регистрации'));
        }
    },

    async registerRequest(companyName, contactPerson, phone, email, message = '') {
        try {
            const response = await api.post('/auth/register-request', {
                company_name: companyName, contact_person: contactPerson, phone, email, message
            });
            return response.data;
        } catch (error) {
            throw new Error(formatApiError(error, 'Ошибка отправки заявки'));
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAdmin');
        window.location.href = '/login';
    }
};

// ============================================================
//  ADMIN API
// ============================================================
export const adminAPI = {
    async getStats() {
        return callApi({ method: 'get', url: '/admin/stats', action: 'Не удалось загрузить статистику' });
    },
    async getUsers() {
        return callApi({ method: 'get', url: '/admin/users', action: 'Не удалось загрузить пользователей' });
    },
    async createUser(userData) {
        return callApi({ method: 'post', url: '/admin/users', data: userData, action: 'Не удалось создать пользователя' });
    },
    async updateUser(id, data) {
        return callApi({ method: 'put', url: `/admin/users/${id}`, data, action: 'Не удалось обновить пользователя' });
    },
    async deleteUser(id) {
        return callApi({ method: 'delete', url: `/admin/users/${id}`, action: 'Не удалось удалить пользователя' });
    },
    async generateOtp(userId) {
        return callApi({ method: 'post', url: '/admin/generate-otp', data: { user_id: userId }, action: 'Ошибка генерации OTP' });
    },
    async getSettings() {
        return callApi({ method: 'get', url: '/admin/settings', action: 'Ошибка загрузки настроек' });
    },
    async updateSettings(data) {
        return callApi({ method: 'put', url: '/admin/settings', data, action: 'Ошибка обновления настроек' });
    },
    async getOrdersLegacy() {
        return callApi({ method: 'get', url: '/admin/orders', action: 'Ошибка загрузки заказов' });
    },
    async updateOrderStatus(id, status) {
        return callApi({ method: 'put', url: `/admin/orders/${id}/status`, data: { status }, action: 'Ошибка изменения статуса' });
    },
    async createDocument(orderId, type) {
        return callApi({ method: 'post', url: `/admin/orders/${orderId}/document`, data: { type }, action: 'Ошибка генерации документа' });
    },
    async getProducts() {
        return callApi({ method: 'get', url: '/admin/products', action: 'Не удалось получить товары' });
    },
    async createProduct(productData) {
        return callApi({ method: 'post', url: '/admin/products', data: productData, action: 'Не удалось создать товар' });
    },
    async updateProduct(id, data) {
        return callApi({ method: 'put', url: `/admin/products/${id}`, data, action: 'Не удалось обновить товар' });
    },
    // Chat management
    async getChats() {
        return callApi({ method: 'get', url: '/admin/chats', action: 'Не удалось загрузить чаты' });
    },
    async getChatMessages(chatId) {
        return callApi({ method: 'get', url: `/chat/messages/${chatId}`, action: 'Не удалось загрузить сообщения чата' });
    },
    async replyToChat(chatId, message) {
        return callApi({ method: 'post', url: `/admin/chats/${chatId}/reply`, data: { message }, action: 'Не удалось отправить ответ' });
    },
    async closeChat(chatId) {
        return callApi({ method: 'put', url: `/admin/chats/${chatId}/close`, action: 'Не удалось закрыть чат' });
    },
    async getSupportSettings() {
        return callApi({ method: 'get', url: '/admin/support-settings', action: 'Не удалось загрузить настройки' });
    },
    async updateSupportSettings(data) {
        return callApi({ method: 'put', url: '/admin/support-settings', data, action: 'Не удалось обновить настройки' });
    },
    async getOrders() {
        return callApi({ method: 'get', url: '/admin/orders', action: 'Не удалось загрузить заказы' });
    },
    async updateOrderStatusLegacy(orderId, status) {
        return callApi({ method: 'put', url: `/admin/orders/${orderId}/status`, data: { status }, action: 'Не удалось обновить статус заказа' });
    }
};

// ============================================================
//  DEVELOPER API
// ============================================================
export const devAPI = {
    async getLogs() {
        return callApi({ method: 'get', url: '/dev/logs', action: 'Не удалось загрузить логи' });
    },
    async getStats() {
        return callApi({ method: 'get', url: '/dev/stats', action: 'Не удалось загрузить статистику' });
    },
    async getUsersFull() {
        return callApi({ method: 'get', url: '/dev/users-full', action: 'Не удалось загрузить пользователей' });
    },
    async getEvents() {
        return callApi({ method: 'get', url: '/dev/events', action: 'Не удалось загрузить события' });
    },
    async createEvent(eventData) {
        return callApi({ method: 'post', url: '/dev/events', data: eventData, action: 'Не удалось создать событие' });
    },
    async updateEvent(id, data) {
        return callApi({ method: 'put', url: `/dev/events/${id}`, data, action: 'Не удалось обновить событие' });
    },
    async deleteEvent(id) {
        return callApi({ method: 'delete', url: `/dev/events/${id}`, action: 'Не удалось удалить событие' });
    },
    async getPasswords() {
        return callApi({ method: 'get', url: '/dev/passwords', action: 'Не удалось загрузить пароли' });
    },
    async getSystemInfo() {
        return callApi({ method: 'get', url: '/dev/system-info', action: 'Не удалось получить системную информацию' });
    },
    async getKanbanBoards() {
        return callApi({ method: 'get', url: '/dev/kanban/boards', action: 'Не удалось загрузить канбан-доски' });
    },
    async createKanbanBoard(data) {
        return callApi({ method: 'post', url: '/dev/kanban/boards', data, action: 'Не удалось создать доску' });
    },
    async updateKanbanBoard(id, data) {
        return callApi({ method: 'put', url: `/dev/kanban/boards/${id}`, data, action: 'Не удалось обновить доску' });
    },
    async deleteKanbanBoard(id) {
        return callApi({ method: 'delete', url: `/dev/kanban/boards/${id}`, action: 'Не удалось удалить доску' });
    },
    async getKanbanTasks(boardId) {
        return callApi({ method: 'get', url: '/dev/kanban/tasks', params: { board_id: boardId }, action: 'Не удалось загрузить задачи' });
    },
    async createKanbanTask(data) {
        return callApi({ method: 'post', url: '/dev/kanban/tasks', data, action: 'Не удалось создать задачу' });
    },
    async updateKanbanTask(id, data) {
        return callApi({ method: 'put', url: `/dev/kanban/tasks/${id}`, data, action: 'Не удалось обновить задачу' });
    },
    async deleteKanbanTask(id) {
        return callApi({ method: 'delete', url: `/dev/kanban/tasks/${id}`, action: 'Не удалось удалить задачу' });
    }
};

// ============================================================
//  CHAT API
// ============================================================
export const chatAPI = {
    async startChat(type, subject) {
        return callApi({ method: 'post', url: '/chat/start', data: { type, subject }, action: 'Не удалось начать чат' });
    },
    async sendMessage(conversationId, message) {
        return callApi({ method: 'post', url: '/chat/send', data: { conversationId, message }, action: 'Не удалось отправить сообщение' });
    },
    async getMyChats() {
        return callApi({ method: 'get', url: '/chat/my', action: 'Не удалось загрузить чаты' });
    },
    async getConversations(params) {
        return callApi({ method: 'get', url: '/chat/conversations', params, action: 'Не удалось загрузить беседы' });
    },
    async getMessages(conversationId) {
        return callApi({ method: 'get', url: `/chat/conversations/${conversationId}`, action: 'Не удалось загрузить сообщения' });
    },
    async assignChat(conversationId, userId) {
        return callApi({ method: 'post', url: `/chat/assign/${conversationId}`, data: { assigned_to: userId }, action: 'Не удалось назначить чат' });
    },
    async closeChat(conversationId) {
        return callApi({ method: 'put', url: `/chat/close/${conversationId}`, action: 'Не удалось закрыть чат' });
    },
    async getUnread() {
        return callApi({ method: 'get', url: '/chat/unread', action: 'Не удалось получить непрочитанные' });
    },
    async markRead(conversationId) {
        return callApi({ method: 'put', url: `/chat/read/${conversationId}`, action: 'Не удалось пометить как прочитанное' });
    }
};

// ============================================================
//  ORDERS API
// ============================================================
export const ordersAPI = {
    async getOrders() {
        const response = await api.get('/orders');
        return normalizeOrders(response.data);
    },
    async getOrderById(id) {
        const response = await api.get(`/orders/${id}`);
        return normalizeOrders(response.data);
    },
    async createOrder(orderData) {
        const response = await api.post('/orders', orderData);
        return normalizeOrders(response.data);
    },
    async cancelOrder(id) {
        const response = await api.put(`/orders/${id}/cancel`);
        return normalizeOrders(response.data);
    }
};

// ============================================================
//  CART API
// ============================================================
export const cartAPI = {
    async getCart() {
        const response = await api.get('/cart');
        return normalizeCart(response.data);
    },
    async addToCart(itemData) {
        const response = await api.post('/cart', itemData);
        return response.data;
    },
    async updateItemQuantity(itemId, quantity) {
        const response = await api.put(`/cart/${itemId}`, { quantity });
        return response.data;
    },
    async removeItem(itemId) {
        const response = await api.delete(`/cart/${itemId}`);
        return response.data;
    },
    async clearCart() {
        const response = await api.delete('/cart');
        return response.data;
    }
};

// ============================================================
//  PRODUCTS API
// ============================================================
export const productsAPI = {
    async getProducts() {
        const response = await api.get('/products');
        return normalizeProductList(response.data);
    },
    async getProductById(id) {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },
    async getProductsByCategory(category) {
        const response = await api.get(`/products/category/${category}`);
        return normalizeProductList(response.data);
    }
};

// ============================================================
//  CABINET API
// ============================================================
export const cabinetAPI = {
    async getDebts() {
        const response = await api.get('/cabinet/debts');
        return response.data;
    },
    async getDocuments(params) {
        const response = await api.get('/cabinet/documents', { params });
        return response.data;
    },
    async getClaims() {
        const response = await api.get('/cabinet/claims');
        return response.data;
    },
    async createClaim(data) {
        const response = await api.post('/cabinet/claims', data);
        return response.data;
    },
    async getCertificates(productId) {
        const response = await api.get('/cabinet/certificates', { params: { productId } });
        return response.data;
    }
};

export default api;
