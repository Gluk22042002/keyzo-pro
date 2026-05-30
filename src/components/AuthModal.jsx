import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from './LanguageSwitcher';

export default function AuthModal({ onClose }) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login(email, password)
        : await api.register(username, email, password, isSeller ? 'seller' : 'user');
      login(data.token, data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-violet-500/20 to-accent-500/20 rounded-3xl blur-xl opacity-50"></div>
        
        <div className="relative glass rounded-3xl p-8 shadow-2xl">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition rounded-xl hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Logo */}
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 via-violet-500 to-accent-400 flex items-center justify-center shadow-xl shadow-primary-500/30">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-1">{isLogin ? t('login') : t('register')}</h2>
          <p className="text-sm text-gray-400 text-center mb-6">{isLogin ? 'Войдите в свой аккаунт' : 'Присоединяйтесь к Keyzo.pro'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Имя пользователя</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm placeholder-gray-600" placeholder="username" />
              </div>
            )}
            {!isLogin && (
              <div className="flex items-center gap-3 p-3 glass rounded-xl border border-white/[0.03]">
                <button type="button" onClick={() => setIsSeller(!isSeller)} className={`relative w-11 h-6 rounded-full transition-colors ${isSeller ? 'bg-primary-500' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isSeller ? 'translate-x-5' : ''}`}></span>
                </button>
                <div>
                  <p className="text-sm text-white font-medium">Я продавец</p>
                  <p className="text-xs text-gray-500">Могу добавлять и продавать товары</p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm placeholder-gray-600" placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm placeholder-gray-600" placeholder="••••••••" />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full h-12 glass-button text-white font-semibold rounded-xl disabled:opacity-40 text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Загрузка...
                </span>
              ) : isLogin ? t('login') : t('register')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary-400 hover:text-primary-300 font-medium ml-1.5 transition">
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
