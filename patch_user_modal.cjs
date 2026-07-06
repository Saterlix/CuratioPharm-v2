const fs = require('fs');
const path = 'src/pages/AdminPage.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add state for user profile modal
if (!content.includes('const [showUserProfileModal, setShowUserProfileModal] = useState(false);')) {
    content = content.replace(
        "const [showOrderModal, setShowOrderModal] = useState(false);",
        "const [showOrderModal, setShowOrderModal] = useState(false);\n    const [showUserProfileModal, setShowUserProfileModal] = useState(false);"
    );
}

// 2. Add Eye button to users table
if (!content.includes("setShowUserProfileModal(true)")) {
    content = content.replace(
        /<button className="action-btn edit" onClick=\{\(\) => \{ setSelectedUser\(user\); setShowCreateModal\(true\); \}\} title="[^"]+">/,
        `<button className="action-btn view" onClick={() => { setSelectedUser(user); setShowUserProfileModal(true); }} title="Профиль"><Eye size={16} /></button>
                                                            <button className="action-btn edit" onClick={() => { setSelectedUser(user); setShowCreateModal(true); }} title="Редактировать">`
    );
}

// 3. Add User Profile Modal JSX
if (!content.includes('className="modal-content user-profile-modal"')) {
    const userModalCode = `
            {/* User Profile Modal */}
            {showUserProfileModal && selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-content user-profile-modal">
                        <div className="modal-header">
                            <h2>Профиль пользователя: {selectedUser.companyName || 'Без компании'}</h2>
                            <button className="close-btn" onClick={() => setShowUserProfileModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="order-details-info">
                                <p><strong>ФИО представителя:</strong> {selectedUser.fullName || 'Не указано'}</p>
                                <p><strong>Email:</strong> {selectedUser.email}</p>
                                <p><strong>Телефон:</strong> {selectedUser.phone || 'Не указан'}</p>
                                <p><strong>Адрес доставки:</strong> {selectedUser.address || 'Не указан'}</p>
                                <p><strong>ИНН / Юр. лицо:</strong> {selectedUser.inn || 'Не указано'}</p>
                                <p><strong>Статус (Роль):</strong> <span className={\`status-badge \${selectedUser.role}\`}>{selectedUser.role}</span></p>
                            </div>
                            <div className="security-actions" style={{marginTop: '20px', padding: '16px', background: '#fee2e2', borderRadius: '8px'}}>
                                <h4 style={{color: '#dc2626', marginBottom: '10px'}}>Безопасность</h4>
                                <p style={{fontSize: '14px', marginBottom: '10px'}}>Вы можете заблокировать доступ этого пользователя к заказам.</p>
                                <button className="btn-danger" onClick={() => { 
                                    handleUpdateUser({ ...selectedUser, is_active: false }); 
                                    setShowUserProfileModal(false); 
                                }}>Заблокировать аккаунт</button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setShowUserProfileModal(false)}>Закрыть</button>
                        </div>
                    </div>
                </div>
            )}`;
            
    content = content.replace(/<\/>\s*\);\s*};\s*export default AdminPage;/g, userModalCode + "\n        </>\n    );\n};\n\nexport default AdminPage;");
    
    if (!content.includes('Eye,')) {
        content = content.replace("FileText,", "FileText,\n    Eye,");
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patched user profile modal!');
