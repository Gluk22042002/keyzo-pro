import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function MobileMenu({ open, onClose, onAuthClick }) {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const links = [
    { to: '/catalog', label: 'Каталог', icon: '🎮' },
    ...(user ? [
      { to: '/orders', label: 'Мои заказы', icon: '🛒' },
      { to: '/favorites', label: 'Избранное', icon: '❤️' },
      { to: '/messages', label: 'Сообщения', icon: '💬' },
      { to: '/cart', label: 'Корзина', icon: '🛍️' },
      { to: '/referral', label: 'Реферальная программа', icon: '🔗' },
      { to: '/loyalty', label: 'Бонусная программа', icon: '⭐' },
      ...(user.role === 'seller' ? [{ to: '/seller', label: 'Панель продавца', icon: '🏪' }] : []),
      ...(user.role === 'admin' ? [{ to: '/admin', label: 'Панель администратора', icon: '⚙️' }] : []),
    ] : []),
  ];

  return (
    <div className="fixed inset-0 z-[90] md:hidden animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>

      <div className={`absolute top-0 left-0 bottom-0 w-72 bg-[#0a0f1a] border-r border-white/5 shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-accent-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <span className="text-lg font-bold text-white">Keyzo<span className="text-gradient">.pro</span></span>
            </Link>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition rounded-xl hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {user && (
            <div className="glass-card rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              {user.balance != null && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Баланс</span>
                  <span className="text-sm font-bold text-accent-400">{user.balance?.toFixed(2) || '0.00'} ₽</span>
                </div>
              )}
            </div>
          )}

          <nav className="space-y-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition"
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-white/5">
            {user ? (
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                Выйти
              </button>
            ) : (
              <button
                onClick={() => { onAuthClick?.(); onClose(); }}
                className="w-full glass-button px-5 py-3 text-white font-semibold rounded-xl text-sm"
              >
                Войти / Регистрация
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
