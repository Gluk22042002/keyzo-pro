import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import SEOTags from '../components/SEOTags';

export default function LoyaltyPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');

  const POINTS_TO_RUBLES = 1;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadLoyaltyData();
  }, [user]);

  const loadLoyaltyData = async () => {
    setLoading(true);
    try {
      const data = await api.getLoyalty();
      setBalance(data.balance || 0);
      setHistory(data.history || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points <= 0) {
      toast.error('Введите корректное количество баллов');
      return;
    }
    if (points > balance) {
      toast.error('Недостаточно баллов');
      return;
    }
    if (points < 100) {
      toast.error('Минимальная сумма вывода — 100 баллов');
      return;
    }

    setRedeeming(true);
    try {
      await api.redeemLoyalty(points);
      setBalance(prev => prev - points);
      setRedeemAmount('');
      toast.success(`Начислено ${points} ₽ на баланс`);
      loadLoyaltyData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <SEOTags title="Бонусная программа" description="Накапливайте баллы и оплачивайте покупки на Keyzo.pro" />
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">⭐</div>
        <p className="text-gray-400 text-lg mb-2">Войдите, чтобы увидеть бонусную программу</p>
        <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block mt-4">На главную</Link>
      </div>
    );
  }

  const maxRedeemable = Math.floor(balance / 100) * 100;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <SEOTags title="Бонусная программа" description="Накапливайте баллы и оплачивайте покупки" />

      <h1 className="text-2xl font-bold text-white mb-2">Бонусная программа</h1>
      <p className="text-gray-400 text-sm mb-8">Накапливайте баллы за покупки и тратьте их на новые заказы</p>

      <div className="glass-card rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-500/10 to-transparent rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Ваш баланс</p>
              <p className="text-3xl font-bold text-white">{balance.toLocaleString()} <span className="text-lg text-gray-400">баллов</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <span>100 баллов = 100 ₽</span>
            <span className="text-gray-700">·</span>
            <span>Минимум вывода: 100 баллов</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Обменять баллы на рубли</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Количество баллов</label>
              <input
                type="number"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                min="100"
                max={balance}
                step="100"
                className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                placeholder="100"
              />
            </div>
            {redeemAmount && parseInt(redeemAmount) >= 100 && (
              <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                <p className="text-sm text-accent-400">
                  Вы получите: <span className="font-bold">{parseInt(redeemAmount).toLocaleString()} ₽</span>
                </p>
              </div>
            )}
            <button
              onClick={handleRedeem}
              disabled={redeeming || !redeemAmount || parseInt(redeemAmount) < 100 || parseInt(redeemAmount) > balance}
              className="w-full glass-button px-5 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-40"
            >
              {redeeming ? 'Обработка...' : 'Обменять'}
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Как заработать баллы</h3>
          <div className="space-y-3">
            {[
              { icon: '🛒', title: 'Покупки', desc: 'Получайте баллы за каждую покупку' },
              { icon: '⭐', title: 'Отзывы', desc: 'Оставляйте отзывы за бонусы' },
              { icon: '🔗', title: 'Рефералы', desc: 'Приглашайте друзей по ссылке' },
              { icon: '🎯', title: 'Акции', desc: 'Участвуйте в специальных акциях' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">История начислений</h2>
        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/[0.02] animate-shimmer" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-gray-500 text-sm">Пока нет начислений</p>
            <p className="text-gray-600 text-xs mt-1">Баллы начисляются за покупки и активности</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={h.id || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition" style={{ animationDelay: `${i * 30}ms` }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${h.type === 'earn' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {h.type === 'earn' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{h.description || (h.type === 'earn' ? 'Начисление' : 'Списание')}</p>
                  <p className="text-xs text-gray-600">{new Date(h.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${h.type === 'earn' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {h.type === 'earn' ? '+' : '-'}{h.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
