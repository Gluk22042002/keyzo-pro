import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from './LanguageSwitcher';
import { useToast } from './Toast';

const plans = [
  {
    id: 'free',
    nameKey: 'free',
    nameRu: 'Бесплатный',
    nameEn: 'Free',
    price: 0,
    color: 'gray',
    gradient: 'from-gray-500/20 to-gray-600/10',
    border: 'border-gray-500/20',
    shadow: 'shadow-gray-500/5',
    featuresRu: [
      'До 5 товаров',
      'Базовая аналитика',
      'Стандартная поддержка',
      'Ручная доставка',
      'Комиссия 15%',
    ],
    featuresEn: [
      'Up to 5 products',
      'Basic analytics',
      'Standard support',
      'Manual delivery',
      '15% commission',
    ],
  },
  {
    id: 'pro',
    nameKey: 'pro',
    nameRu: 'Профессиональный',
    nameEn: 'Professional',
    price: 490,
    color: 'primary',
    gradient: 'from-primary-500/20 to-violet-500/10',
    border: 'border-primary-500/30',
    shadow: 'shadow-primary-500/10',
    popular: true,
    featuresRu: [
      'До 50 товаров',
      'Расширенная аналитика',
      'Приоритетная поддержка',
      'Авто-доставка',
      'Комиссия 10%',
      'Продвижение в каталоге',
    ],
    featuresEn: [
      'Up to 50 products',
      'Advanced analytics',
      'Priority support',
      'Auto delivery',
      '10% commission',
      'Catalog promotion',
    ],
  },
  {
    id: 'business',
    nameKey: 'business',
    nameRu: 'Бизнес',
    nameEn: 'Business',
    price: 1490,
    color: 'accent',
    gradient: 'from-accent-500/20 to-cyan-500/10',
    border: 'border-accent-500/30',
    shadow: 'shadow-accent-500/10',
    featuresRu: [
      'Безлимит товаров',
      'Полная аналитика + API',
      'Выделенный менеджер',
      'Авто-доставка + Webhook',
      'Комиссия 5%',
      'Топ в каталоге',
      'Кастомный магазин',
      'Белая-labelинг',
    ],
    featuresEn: [
      'Unlimited products',
      'Full analytics + API',
      'Dedicated manager',
      'Auto delivery + Webhook',
      '5% commission',
      'Top in catalog',
      'Custom storefront',
      'White-labeling',
    ],
  },
];

export default function SellerSubscription() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [subscribing, setSubscribing] = useState(null);
  const currentPlan = user?.subscription || 'free';

  const handleSubscribe = async (planId) => {
    if (planId === currentPlan) return;
    setSubscribing(planId);
    try {
      const res = await fetch('/api/seller/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      toast.success(`Подписка «${lang === 'ru' ? plans.find(p => p.id === planId)?.nameRu : plans.find(p => p.id === planId)?.nameEn}» активирована`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Тарифные планы для продавцов</h2>
        <p className="text-gray-400 text-sm">Выберите план, который подходит именно вам</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isActive = currentPlan === plan.id;
          const features = lang === 'ru' ? plan.featuresRu : plan.featuresEn;
          const planName = lang === 'ru' ? plan.nameRu : plan.nameEn;

          return (
            <div
              key={plan.id}
              className={`relative glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                isActive ? 'ring-2 ring-primary-500/50' : ''
              } ${plan.popular ? 'md:-mt-3 md:mb-0' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="glass-button px-3 py-1 text-[10px] font-bold text-white rounded-full uppercase tracking-wider">
                    Популярный
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} border ${plan.border} flex items-center justify-center mb-4 shadow-lg ${plan.shadow}`}>
                <span className="text-2xl">
                  {plan.id === 'free' ? '🎁' : plan.id === 'pro' ? '⚡' : '🚀'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{planName}</h3>

              <div className="flex items-baseline gap-1 mb-5">
                {plan.price === 0 ? (
                  <span className="text-2xl font-bold text-emerald-400">{t('free')}</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-white">{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">₽{t('perMonth')}</span>
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isActive || subscribing === plan.id}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default'
                    : plan.popular
                      ? 'glass-button text-white disabled:opacity-40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5 disabled:opacity-40'
                }`}
              >
                {isActive ? '✓ Текущий план' : subscribing === plan.id ? t('loading') : t('subscribe')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
