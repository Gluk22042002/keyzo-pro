import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import TopUpModal from './TopUpModal';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from './LanguageSwitcher';
import ShareButton from './ShareButton';
import BackToTop from './BackToTop';

export default function Header({ onAuthClick, onMenuClick }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const isProductPage = location.pathname.startsWith('/product/');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (search.length > 1) api.search(search).then(setSuggestions).catch(() => setSuggestions([]));
    else setSuggestions([]);
  }, [search]);

  useEffect(() => {
    if (user) api.getUnreadCount().then(d => setUnreadMsgs(d.count)).catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/catalog?search=${encodeURIComponent(search.trim())}`); setShowSearch(false); setSearch(''); }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('closeAllModals'));
        const activeEl = document.activeElement;
        if (activeEl && activeEl !== document.body) activeEl.blur();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-accent-400 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="hidden sm:block"><span className="text-lg font-bold text-white">Keyzo</span><span className="text-lg font-bold text-gradient">.pro</span></span>
          </Link>

          <div ref={searchRef} className="relative flex-1 max-w-lg">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input ref={searchInputRef} type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} placeholder={t('search')} className="w-full h-10 pl-10 pr-16 glass-input rounded-xl text-sm text-white placeholder-gray-500" />
                <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <kbd className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-gray-600">/</kbd>
              </div>
            </form>
            {showSearch && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full glass rounded-xl shadow-2xl shadow-black/40 overflow-hidden border border-white/5 animate-scale-in">
                {suggestions.map(s => (
                  <Link key={s.id} to={`/product/${s.id}`} onClick={() => { setShowSearch(false); setSearch(''); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition group">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs shrink-0 overflow-hidden">{s.image ? <img src={s.image} className="w-full h-full object-cover" /> : '🎮'}</div>
                    <span className="text-sm text-gray-200 group-hover:text-white truncate">{s.title}</span>
                    <span className="text-sm text-primary-400 ml-auto shrink-0 font-medium">{s.price} ₽</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <nav className="flex items-center gap-1">
            <button onClick={onMenuClick} className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5 md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <Link to="/catalog" className="px-2.5 py-2 text-sm text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5 hidden md:block">{t('catalog')}</Link>
            <Link to="/giftcards" className="px-2.5 py-2 text-sm text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5 hidden md:block">🎁</Link>
            <LanguageSwitcher />
            {isProductPage && <ShareButton />}
            {user ? (
              <>
                <Link to="/favorites" className="relative p-2 text-gray-400 hover:text-rose-400 transition rounded-lg hover:bg-white/5 hidden sm:block" title={t('favorites')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </Link>
                <Link to="/messages" className="relative p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5 hidden sm:block" title={t('messages')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  {unreadMsgs > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadMsgs}</span>}
                </Link>
                <Link to="/cart" className="relative p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5" title={t('cart')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
                </Link>
                {user.role === 'seller' && (
                  <Link to="/seller" className="px-2.5 py-2 text-sm text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5 hidden md:block">🏪 {t('seller')}</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="px-2.5 py-2 text-sm text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5 hidden md:block">🛡️ {t('admin')}</Link>
                )}
                <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-white/10">
                  <button onClick={() => setShowTopUp(true)} className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-500/10 text-accent-400 text-xs font-bold hover:bg-accent-500/20 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6"/></svg>
                    {user.balance?.toFixed(0) || 0} ₽
                  </button>
                  <Link to={user.role === 'seller' ? '/seller' : '/orders'} className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-primary-500/20">{user.username[0].toUpperCase()}</Link>
                  <button onClick={logout} className="p-1.5 text-gray-600 hover:text-rose-400 transition rounded-lg hover:bg-white/5 hidden sm:block" title={t('logout')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
              </>
            ) : (
              <button onClick={onAuthClick} className="glass-button px-5 py-2 text-sm font-semibold text-white rounded-xl">{t('login')}</button>
            )}
          </nav>
        </div>
      </header>
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
      <BackToTop />
    </>
  );
}
