import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function TopUpModal({ onClose }) {
  const { user, login } = useAuth();
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const amounts = [100, 200, 500, 1000, 2000, 5000];

  const handleTopUp = async () => {
    setLoading(true);
    try {
      const data = await api.addBalance(amount);
      login(localStorage.getItem('token'), { ...user, balance: data.balance });
      setSuccess(true);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
      <div className="relative w-full max-w-sm glass rounded-3xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Баланс пополнен!</h3>
            <p className="text-sm text-gray-400">+{amount.toLocaleString()} ₽</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white text-center mb-5">Пополнить баланс</h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {amounts.map(a => (
                <button key={a} onClick={() => setAmount(a)} className={`h-11 rounded-xl text-sm font-semibold transition-all ${amount === a ? 'bg-gradient-to-r from-primary-500 to-violet-600 text-white shadow-lg shadow-primary-500/30' : 'glass-input text-gray-300 hover:text-white'}`}>
                  {a.toLocaleString()} ₽
                </button>
              ))}
            </div>
            <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} min="50" className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm mb-4" />
            <button onClick={handleTopUp} disabled={loading || amount <= 0} className="w-full h-12 glass-button text-white font-bold rounded-xl disabled:opacity-40">
              {loading ? 'Обработка...' : `Пополнить на ${amount.toLocaleString()} ₽`}
            </button>
            <p className="text-center text-xs text-gray-600 mt-3">Демо-баланс · реальных платежей нет</p>
          </>
        )}
      </div>
    </div>
  );
}
