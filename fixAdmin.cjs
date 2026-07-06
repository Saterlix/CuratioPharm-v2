const fs = require('fs');

const path = 'src/pages/AdminPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace(
`import Navbar from './Navbar';
import './AdminPage.css';`,
`import Navbar from './Navbar';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import './AdminPage.css';`
);

// 2. Component init
content = content.replace(
`const AdminPage = () => {
    const { isAuthenticated, isAdmin, user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();`,
`const AdminPage = () => {
    const { isAuthenticated, isAdmin, user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'normal' });
    
    const showConfirm = (title, message, onConfirm, type = 'normal') => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                onConfirm();
            },
            type
        });
    };`
);

// 3. handleCreateUser
content = content.replace(
`            if (response.otp?.code || response.code) {
                setGeneratedOtp({
                    code: response.otp?.code || response.code,
                    expiresAt: response.otp?.expires_at || response.expires_at,
                    email: response.otp?.user_email || response.user?.email || newUser.email
                });
                setShowOtpModal(true);
                setOtpCopied(false);
            }
            setSuccessMessage('Пользователь создан. Одноразовый код готов к выдаче.');
            setShowCreateModal(false);
            setNewUser({ email: '', companyName: '', contactPerson: '', phone: '', address: '', role: 'client' });
            loadData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }`,
`            if (response.otp?.code || response.code) {
                setGeneratedOtp({
                    code: response.otp?.code || response.code,
                    expiresAt: response.otp?.expires_at || response.expires_at,
                    email: response.otp?.user_email || response.user?.email || newUser.email
                });
                setShowOtpModal(true);
                setOtpCopied(false);
            }
            addToast('Пользователь создан. Одноразовый код готов к выдаче.', 'success');
            setShowCreateModal(false);
            setNewUser({ email: '', companyName: '', contactPerson: '', phone: '', address: '', role: 'client' });
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }`
);

// 4. handleToggleUserActive
content = content.replace(
`    const handleToggleUserActive = async (userId, currentState) => {
        try {
            await adminAPI.updateUser(userId, { isActive: !currentState });
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };`,
`    const handleToggleUserActive = async (userId, currentState) => {
        try {
            await adminAPI.updateUser(userId, { isActive: !currentState });
            addToast(\`Пользователь \${!currentState ? 'активирован' : 'деактивирован'}\`, 'success');
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    };`
);

// 5. handleDeleteUser
content = content.replace(
`    const handleDeleteUser = async (userId) => {
        if (window.confirm('Вы уверены, что хотите деактивировать этого пользователя?')) {
            try {
                await adminAPI.deleteUser(userId);
                loadData();
            } catch (err) {
                setError(err.message);
            }
        }
    };`,
`    const handleDeleteUser = (userId) => {
        showConfirm('Деактивация', 'Вы уверены, что хотите деактивировать этого пользователя?', async () => {
            try {
                await adminAPI.deleteUser(userId);
                addToast('Пользователь деактивирован', 'success');
                loadData();
            } catch (err) {
                addToast(err.message, 'error');
            }
        }, 'danger');
    };`
);

// 6. copyOtpToClipboard
content = content.replace(
`    const copyOtpToClipboard = () => {
        if (generatedOtp) {
            navigator.clipboard.writeText(generatedOtp.code);
            setOtpCopied(true);
            setTimeout(() => setOtpCopied(false), 2000);
        }
    };`,
`    const copyOtpToClipboard = () => {
        if (generatedOtp) {
            navigator.clipboard.writeText(generatedOtp.code);
            setOtpCopied(true);
            addToast('Код скопирован в буфер обмена', 'success');
            setTimeout(() => setOtpCopied(false), 2000);
        }
    };`
);

// 7. handleCloseChat
content = content.replace(
`    const handleCloseChat = async (chatId) => {
        if (!window.confirm('Вы действительно хотите закрыть этот диалог?')) return;

        setError('');
        try {
            await adminAPI.closeChat(chatId);
            setSuccessMessage('Чат успешно закрыт');
            setSelectedChat(null);
            setChatMessages([]);
            const chatsResponse = await adminAPI.getChats();
            setChats(chatsResponse || []);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message || 'Не удалось закрыть чат');
        }
    };`,
`    const handleCloseChat = (chatId) => {
        showConfirm('Закрыть чат', 'Вы действительно хотите закрыть этот диалог?', async () => {
            setError('');
            try {
                await adminAPI.closeChat(chatId);
                addToast('Чат успешно закрыт', 'success');
                setSelectedChat(null);
                setChatMessages([]);
                const chatsResponse = await adminAPI.getChats();
                setChats(chatsResponse || []);
            } catch (err) {
                addToast(err.message || 'Не удалось закрыть чат', 'error');
            }
        });
    };`
);

// 8. handleSaveProduct
content = content.replace(
`    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingProduct) {
                await adminAPI.updateProduct(editingProduct.id, productForm);
                setSuccessMessage('Товар обновлен');
            } else {
                await adminAPI.createProduct(productForm);
                setSuccessMessage('Товар добавлен');
            }
            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm({ name: '', manufacturer: '', price: '', stock: '', category: '' });
            loadData();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };`,
`    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingProduct) {
                await adminAPI.updateProduct(editingProduct.id, productForm);
                addToast('Товар обновлен', 'success');
            } else {
                await adminAPI.createProduct(productForm);
                addToast('Товар добавлен', 'success');
            }
            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm({ name: '', manufacturer: '', price: '', stock: '', category: '' });
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    };`
);

// 9. Typo #white
content = content.replace(/color: '#white'/g, "color: 'white'");

// 10. End of file - Modal
content = content.replace(
`                )}
            </main>
        </>
    );
};`,
`                )}
            </main>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                type={confirmState.type}
            />
        </>
    );
};`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
