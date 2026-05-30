import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from './CurrencySwitcher';

function CountdownDigit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center">
        <span className="text-2xl sm:text-3xl font-black text-white font-mono">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function FlashSaleBanner() {
  const { convert } = useCurrency();
  const [endTime] = useState(() => {
    const saved = localStorage.getItem('flashSaleEnd');
    if (saved && Number(saved) > Date.now()) return Number(saved);
    const end = Date.now() + 4 * 60 * 60 * 1000;
    localStorage.setItem('flashSaleEnd', end);
    return end;
  });

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
      setPulse(p => !p);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const flashProducts = [
    { id: 1, title: 'GTA V Premium', originalPrice: 2990, salePrice: 1490, discount: 50, emoji: '🎮' },
    { id: 2, title: 'Steam 1000₽', originalPrice: 1000, salePrice: 850, discount: 15, emoji: '💰' },
    { id: 3, title: 'PS Plus 12 мес', originalPrice: 4990, salePrice: 3490, discount: 30, emoji: '🌟' },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl animate-slide-up">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-600/20 via-orange-600/10 to-amber-600/20"></div>
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30">
                <span className={`relative flex h-2 w-2 ${pulse ? 'opacity-100' : 'opacity-50'} transition-opacity`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Flash Sale</span>
              </div>
              <span className="text-xs text-gray-500">До конца распродажи:</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Грандиозная <span className="text-gradient">распродажа</span>
            </h2>
            <p className="text-gray-400 mb-5 max-w-md">Скидки до 50% на лучшие цифровые товары. Успей купить по невероятным ценам!</p>

            <div className="flex items-center gap-3">
              <CountdownDigit value={timeLeft.hours} label="часов" />
              <span className="text-2xl font-bold text-gray-600 mt-[-20px]">:</span>
              <CountdownDigit value={timeLeft.minutes} label="минут" />
              <span className="text-2xl font-bold text-gray-600 mt-[-20px]">:</span>
              <CountdownDigit value={timeLeft.seconds} label="секунд" />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 w-full lg:w-auto">
            {flashProducts.map(p => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="shrink-0 w-40 p-4 glass-card rounded-2xl text-center group hover:border-rose-500/30 transition"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{p.emoji}</div>
                <p className="text-xs text-gray-300 font-medium mb-2 line-clamp-1">{p.title}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-bold text-rose-400">{convert(p.salePrice)}</span>
                  <span className="text-xs text-gray-600 line-through">{convert(p.originalPrice)}</span>
                </div>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                  -{p.discount}%
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
