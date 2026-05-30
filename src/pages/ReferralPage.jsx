import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import SEOTags from '../components/SEOTags';

export default function ReferralPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const data = await api.getReferral();
      setReferralCode(data.code || user.referral_code || '');
      setReferralLink(data.link || `${window.location.origin}/ref/${data.code || user.referral_code || ''}`);
      setReferrals(data.referrals || []);
      setTotalEarned(data.total_earned || 0);
      setTotalReferrals(data.total_referrals || 0);
    } catch (err) {
      setReferralCode(user.referral_code || '');
      setReferralLink(`${window.location.origin}/ref/${user.referral_code || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Скопировано в буфер обмена');
    }).catch(() => {
      toast.error('Не удалось скопировать');
    });
  };

  if (!user) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <SEOTags title="Реферальная программа" description="Приглашайте друзей и зарабатывайте на Keyzo.pro" />
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">🔗</div>
        <p className="text-gray-400 text-lg mb-2">Войдите, чтобы увидеть реферальную программу</p>
        <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block mt-4">На главную</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <SEOTags title="Реферальная программа" description="Приглашайте друзей и зарабатывайте бонусы на Keyzo.pro" />

      <h1 className="text-2xl font-bold text-white mb-2">Реферальная программа</h1>
      <p className="text-gray-400 text-sm mb-8">Приглашайте друзей и получайте бонусы за каждую покупку</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👥</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Приглашено</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalReferrals}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">💰</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Заработано</span>
          </div>
          <div className="text-2xl font-bold text-accent-400">{totalEarned.toLocaleString()} ₽</div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Ваша реферальная ссылка</h2>
        <div className="flex gap-3">
          <div className="flex-1 h-12 px-4 glass-input rounded-xl flex items-center overflow-hidden">
            <span className="text-sm text-gray-300 truncate font-mono">{referralLink}</span>
          </div>
          <button
            onClick={() => copyToClipboard(referralLink)}
            className="glass-button px-5 h-12 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Копировать
          </button>
        </div>

        {referralCode && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-gray-500">Ваш код:</span>
            <span className="text-sm font-bold text-primary-400 font-mono bg-primary-500/10 px-3 py-1 rounded-lg">{referralCode}</span>
            <button onClick={() => copyToClipboard(referralCode)} className="text-xs text-gray-500 hover:text-primary-400 transition">Копировать код</button>
          </div>
        )}

        <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">Как это работает</h3>
          <ul className="space-y-1.5">
            <li className="text-xs text-gray-500 flex items-start gap-2">
              <span className="text-primary-400 mt-0.5">1.</span>
              Поделитесь ссылкой с друзьями
            </li>
            <li className="text-xs text-gray-500 flex items-start gap-2">
              <span className="text-primary-400 mt-0.5">2.</span>
              Друг регистрируется по вашей ссылке
            </li>
            <li className="text-xs text-gray-500 flex items-start gap-2">
              <span className="text-primary-400 mt-0.5">3.</span>
              Вы получаете бонусы за каждую его покупку
            </li>
          </ul>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Приглашённые пользователи</h2>
        {referrals.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-3">👥</div>
            <p className="text-gray-500 text-sm">Вы пока никого не пригласили</p>
            <p className="text-gray-600 text-xs mt-1">Поделитесь ссылкой, чтобы начать зарабатывать</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r, i) => (
              <div key={r.id || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                  {r.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-200 font-medium">{r.username || 'Пользователь'}</span>
                  <span className="text-xs text-gray-600 ml-2">{new Date(r.registered_at || r.created_at).toLocaleDateString('ru')}</span>
                </div>
                <span className="text-sm text-accent-400 font-medium shrink-0">+{r.earned || 0} ₽</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
