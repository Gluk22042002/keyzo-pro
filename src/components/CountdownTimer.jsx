import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageSwitcher';

export default function CountdownTimer({ expiresAt, onExpire, compact = false, className = '' }) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  const calculate = useCallback(() => {
    if (!expiresAt) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }, [expiresAt]);

  useEffect(() => {
    const result = calculate();
    setTimeLeft(result);
    if (result.expired) { onExpire?.(); return; }

    const interval = setInterval(() => {
      const next = calculate();
      setTimeLeft(next);
      if (next.expired) { clearInterval(interval); onExpire?.(); }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, calculate, onExpire]);

  if (timeLeft.expired) return null;

  const urgent = timeLeft.days === 0 && timeLeft.hours < 6;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono ${urgent ? 'text-rose-400' : 'text-gray-400'} ${className}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {timeLeft.days > 0 && <span>{timeLeft.days}{t('days')}</span>}
        <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
      </span>
    );
  }

  const blocks = [
    { value: timeLeft.days, label: t('days') },
    { value: timeLeft.hours, label: t('hours') },
    { value: timeLeft.minutes, label: t('minutes') },
    { value: timeLeft.seconds, label: t('seconds') },
  ];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {urgent && (
        <span className="text-xs text-rose-400 font-medium flex items-center gap-1 animate-pulse">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {t('expiresSoon')}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {blocks.map((block, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`flex flex-col items-center justify-center min-w-[44px] h-12 rounded-xl px-2 ${urgent ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/[0.03] border border-white/5'}`}>
              <span className={`text-lg font-bold font-mono tabular-nums ${urgent ? 'text-rose-400' : 'text-white'}`}>
                {String(block.value).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider -mt-0.5">{block.label}</span>
            </div>
            {i < blocks.length - 1 && (
              <span className={`text-sm font-bold ${urgent ? 'text-rose-500/50' : 'text-gray-600'} -mt-2`}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
