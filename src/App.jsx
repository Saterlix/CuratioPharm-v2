import './App.css'
import './themes.css'
import './light-upgrade.css'
import { Routes, Route, useLocation } from 'react-router-dom';
import {
  HomePage,
  AboutPage,
  ProductsPage,
  DeliveryPage,
  ContactsPage,
  LoginPage,
  CabinetPage,
  CooperationPage,
  AdminPage,
  AdminLoginPage,
  ProductCatalogPage,
  ShoppingCartPage,
  OrderHistoryPage,
  DevPanelPage,
  ChatRegistrationPage,
  SupportPanelPage,
  ManagerPanelPage,
  Footer
} from './pages';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PageStyleProvider } from './context/PageStyleContext';
import PageTransition from './components/PageTransition';
import ChatWidget from './components/ChatWidget';
import { ToastProvider } from './context/ToastContext';
import EventBanner from './components/EventBanner';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <PageStyleProvider>
        <AuthProvider>
          <ToastProvider>
            <EventBanner />
            <ScrollToTop />
            <PageTransition>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/delivery" element={<DeliveryPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/cooperation" element={<CooperationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<ChatRegistrationPage />} />
                <Route path="/cabinet" element={<CabinetPage />} />
                <Route path="/catalog" element={<ProductCatalogPage />} />
                <Route path="/cart" element={<ShoppingCartPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/cp-support-panel" element={<SupportPanelPage />} />
                <Route path="/cp-manager-panel" element={<ManagerPanelPage />} />
                {/* Secret admin routes */}
                <Route path="/cp-admin-2024" element={<AdminLoginPage />} />
                <Route path="/cp-admin-panel" element={<AdminPage />} />
                {/* Developer Console route */}
                <Route path="/cp-developer-panel" element={<DevPanelPage />} />
              </Routes>
            </PageTransition>
            <ChatWidget />
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </PageStyleProvider>
    </ThemeProvider>
  )
}

export default App
