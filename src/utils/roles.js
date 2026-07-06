export const ROLE_ALIASES = {
    manager: 'operator',
    hr: 'admin',
    partner: 'client'
};

export const ROLE_LABELS = {
    developer: 'Разработчик',
    admin: 'Администратор',
    support: 'Поддержка',
    operator: 'Оператор',
    client: 'Клиент',
    ai: 'ИИ',
    manager: 'Оператор',
    hr: 'Администратор',
    partner: 'Клиент'
};

export const normalizeRole = (role) => {
    if (!role) return 'client';
    const lower = role.toLowerCase();
    return ROLE_ALIASES[lower] || lower;
};

export const isDeveloperRole = (role) => normalizeRole(role) === 'developer';

export const isBackofficeRole = (role) =>
    ['developer', 'admin', 'support', 'operator', 'ai'].includes(normalizeRole(role));

export const canManageUsersRole = (role) =>
    ['developer', 'admin'].includes(normalizeRole(role));

export const canManageCatalogRole = (role) =>
    ['developer', 'admin', 'operator'].includes(normalizeRole(role));

export const canManageChatsRole = (role) =>
    ['developer', 'admin', 'support', 'operator'].includes(normalizeRole(role));

export const canManageSupportSettingsRole = (role) =>
    ['developer', 'admin', 'support'].includes(normalizeRole(role));

export const getRoleLabel = (role) => ROLE_LABELS[role] || ROLE_LABELS[normalizeRole(role)] || 'Клиент';

export const getRoleHome = (role) => {
    const normalized = normalizeRole(role);
    if (normalized === 'developer') return '/cp-developer-panel';
    if (normalized === 'admin' || normalized === 'ai') return '/cp-admin-panel';
    if (normalized === 'support') return '/cp-support-panel';
    if (normalized === 'manager' || normalized === 'operator') return '/cp-manager-panel';
    return '/cabinet';
};

export const canViewPasswords = (role) => normalizeRole(role) === 'developer';
export const canManageEvents = (role) => ['developer'].includes(normalizeRole(role));
export const canViewKanban = (role) => ['developer'].includes(normalizeRole(role));
export const canViewSystemInfo = (role) => ['developer'].includes(normalizeRole(role));
export const canManageOrders = (role) => ['developer', 'admin', 'operator'].includes(normalizeRole(role));
export const canViewSupportTickets = (role) => ['developer', 'admin', 'support'].includes(normalizeRole(role));
