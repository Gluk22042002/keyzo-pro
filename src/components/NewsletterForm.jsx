import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubscribed(true);
    setLoading(false);
  };

  if (subscribed) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center animate-scale-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/15 flex items-center justify-center animate-float">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Вы подписаны!</h3>
        <p className="text-gray-400 text-sm">Спасибо за подписку. Мы будем присылать лучшие предложения на <span className="text-white font-medium">{email}</span></p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-cyan-600/10"></div>
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-xs text-indigo-400 font-medium mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Newsletter
        </div>
        <h3 className="text-2xl font-black text-white mb-2">Не пропустите скидки</h3>
        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">Подпишитесь на рассылку и получайте эксклюзивные предложения, промокоды и новости первыми.</p>

        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Ваш email"
            className="flex-1 h-12 px-4 glass-input rounded-xl text-white text-sm placeholder-gray-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 glass-button text-white font-semibold rounded-xl disabled:opacity-40 shrink-0 flex items-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Подписаться
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-600 mt-3">Никакого спама. Только полезные предложения.</p>
      </div>
    </div>
  );
}
