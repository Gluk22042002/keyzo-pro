import { useState } from 'react';
import { useCurrency } from './CurrencySwitcher';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

const amounts = [500, 1000, 1500, 2000, 3000, 5000];

export default function GiftCardShop() {
  const { user } = useAuth();
  const { convert } = useCurrency();
  const [selected, setSelected] = useState(1000);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [error, setError] = useState('');

  const handleBuy = async () => {
    if (!user) { setError('Войдите, чтобы купить подарочную карту'); return; }
    if (!email.trim()) { setError('Введите email получателя'); return; }
    setBuying(true);
    setError('');
    try {
      await api.createOrder(null, null);
      setBought(true);
    } catch (err) {
      setError(err.message || 'Ошибка при покупке');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/15 border border-violet-500/20 text-sm text-violet-400 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          Подарочные карты
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Подарочная карта Keyzo</h1>
        <p className="text-gray-400">Подарите близким цифровой подарок. Баланс зачисляется мгновенно.</p>
      </div>

      {bought ? (
        <div className="glass-card rounded-2xl p-8 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Подарочная карта отправлена!</h2>
          <p className="text-gray-400 text-sm">Код отправлен на <span className="text-white font-medium">{email}</span></p>
          <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-gray-500 mb-1">Ваш баланс</p>
            <p className="text-2xl font-black text-white">{convert(selected)}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Выберите номинал</h2>
            <div className="grid grid-cols-3 gap-3">
              {amounts.map(a => (
                <button
                  key={a}
                  onClick={() => setSelected(a)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selected === a
                      ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-white'
                      : 'glass-input text-gray-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <div className="text-lg font-bold">{convert(a)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email получателя</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="recipient@email.com"
                className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Сообщение (необязательно)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="С днём рождения! 🎉"
                rows={2}
                className="w-full px-4 py-3 glass-input rounded-xl text-white text-sm resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-400">{error}</p>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-sm text-gray-400">Итого:</span>
              <span className="text-2xl font-black text-white">{convert(selected)}</span>
            </div>

            <button
              onClick={handleBuy}
              disabled={buying}
              className="w-full h-12 glass-button text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {buying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Обработка...
                </>
              ) : 'Купить подарочную карту'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '⚡', title: 'Мгновенно', desc: 'Код приходит за секунды' },
              { icon: '🔒', title: 'Безопасно', desc: 'Безопасная оплата' },
              { icon: '🎁', title: 'Универсально', desc: 'Любой товар на сайте' },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-sm text-white font-medium">{f.title}</p>
                <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
