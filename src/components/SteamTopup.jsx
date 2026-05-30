import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

export default function SteamTopup({ onAuthClick }) {
  const { user } = useAuth();
  const [login, setLogin] = useState('');
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const amounts = [200, 500, 1000, 2000, 5000];
  const rates = { 200: 1.06, 500: 1.05, 1000: 1.04, 2000: 1.03, 5000: 1.02 };

  const getRate = (sum) => rates[sum] || 1.06;
  const getFinal = (sum) => Math.round(sum * getRate(sum));

  const handleTopup = async () => {
    if (!user) return onAuthClick();
    if (!login.trim()) return alert('Введите логин Steam');
    setLoading(true);
    try {
      await api.createOrder('prod-topup');
      setSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-dark-900/80 to-cyan-600/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      
      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5l4.28 2.5-4.28 2.5z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Пополнение Steam</h2>
            <p className="text-sm text-gray-400">Моментально · 24/7 · Автоматически</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-8 animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Заявка создана!</h3>
            <p className="text-sm text-gray-400">Средства поступят на Steam-кошелёк {login} в течение 1-5 минут</p>
          </div>
        ) : (
          <>
            {/* Steam Login */}
            <div className="mb-5">
              <label className="block text-sm text-gray-400 mb-2 font-medium">Логин Steam</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин или Steam ID"
                className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm placeholder-gray-600"
              />
            </div>

            {/* Amount Selection */}
            <div className="mb-5">
              <label className="block text-sm text-gray-400 mb-2 font-medium">Сумма пополнения</label>
              <div className="grid grid-cols-5 gap-2">
                {amounts.map(sum => (
                  <button
                    key={sum}
                    onClick={() => setAmount(sum)}
                    className={`h-11 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      amount === sum
                        ? 'bg-gradient-to-r from-primary-500 to-violet-600 text-white shadow-lg shadow-primary-500/30 scale-105'
                        : 'glass-input text-gray-300 hover:text-white hover:border-primary-500/30'
                    }`}
                  >
                    {sum.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-5">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                min="50"
                max="50000"
                className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm"
              />
            </div>

            {/* Info */}
            <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Вы получите на Steam</span>
                <span className="text-sm font-bold text-white">{amount.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Курс</span>
                <span className="text-sm text-accent-400 font-medium">×{getRate(amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Итого к оплате</span>
                <span className="text-lg font-bold text-white">{getFinal(amount).toLocaleString()} ₽</span>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleTopup}
              disabled={loading || !login.trim()}
              className="w-full h-13 py-3.5 glass-button text-white font-bold text-base rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Обработка...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Пополнить Steam
                </span>
              )}
            </button>

            {/* Trust */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Автоматически
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                1-5 мин
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                24/7
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
