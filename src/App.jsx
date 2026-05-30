import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './components/LanguageSwitcher';
import { CurrencyProvider } from './components/CurrencySwitcher';
import Header from './components/Header';
import MobileMenu from './components/MobileMenu';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import SellerDashboard from './pages/SellerDashboard';
import SellerProfile from './pages/SellerProfile';
import MessagesPage from './pages/MessagesPage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPanel from './pages/AdminPanel';
import ReferralPage from './pages/ReferralPage';
import LoyaltyPage from './pages/LoyaltyPage';
import DisputePage from './pages/DisputePage';
import ProfileSettings from './pages/ProfileSettings';
import BlogPage from './pages/BlogPage';
import GiftCardShop from './components/GiftCardShop';
import AuthModal from './components/AuthModal';
import PWAInstall from './components/PWAInstall';
import OfflineIndicator from './components/OfflineIndicator';
import AnimatedPage from './components/AnimatedPage';
import PageTransition from './components/PageTransition';

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-[#030712]">
                <Header onAuthClick={() => setShowAuth(true)} onMenuClick={() => setShowMobileMenu(true)} />
                <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} onAuthClick={() => { setShowMobileMenu(false); setShowAuth(true); }} />
                <OfflineIndicator />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
                  <PageTransition>
                    <AnimatedPage>
                      <Routes>
                        <Route path="/" element={<HomePage onAuthClick={() => setShowAuth(true)} />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/catalog/:category" element={<CatalogPage />} />
                        <Route path="/product/:id" element={<ProductPage onAuthClick={() => setShowAuth(true)} />} />
                        <Route path="/cart" element={<CartPage onAuthClick={() => setShowAuth(true)} />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/seller" element={<SellerDashboard />} />
                        <Route path="/seller/:id" element={<SellerProfile />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/messages/:userId" element={<MessagesPage />} />
                        <Route path="/favorites" element={<FavoritesPage />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/referrals" element={<ReferralPage />} />
                        <Route path="/loyalty" element={<LoyaltyPage />} />
                        <Route path="/dispute/:orderId" element={<DisputePage />} />
                        <Route path="/settings" element={<ProfileSettings />} />
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/blog/:slug" element={<BlogPage />} />
                        <Route path="/giftcards" element={<GiftCardShop />} />
                        <Route path="/health" element={<div className="text-center py-20"><h1 className="text-2xl font-bold text-white">Keyzo.pro</h1><p className="text-gray-400">Сервер работает</p></div>} />
                      </Routes>
                    </AnimatedPage>
                  </PageTransition>
                </main>
                {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
                <PWAInstall />
              </div>
            </BrowserRouter>
          </CurrencyProvider>
        </LanguageProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
