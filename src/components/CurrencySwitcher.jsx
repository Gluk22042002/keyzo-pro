import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const rates = { RUB: 1, USD: 0.011, KZT: 5.1, UAH: 0.45 };
const symbols = { RUB: '₽', USD: '$', KZT: '₸', UAH: '₴' };
const CurrencyContext = createContext();

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'RUB');

  useEffect(() => { localStorage.setItem('currency', currency); }, [currency]);

  const convert = useCallback((priceRUB) => {
    if (!priceRUB && priceRUB !== 0) return '';
    const converted = priceRUB * rates[currency];
    return `${Math.round(converted).toLocaleString()} ${symbols[currency]}`;
  }, [currency]);

  const convertRaw = useCallback((priceRUB) => {
    return priceRUB * rates[currency];
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, convertRaw, symbol: symbols[currency] }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const options = [
    { code: 'RUB', label: '₽ RUB', name: 'Рубли' },
    { code: 'USD', label: '$ USD', name: 'Доллары' },
    { code: 'KZT', label: '₸ KZT', name: 'Тенге' },
    { code: 'UAH', label: '₴ UAH', name: 'Гривны' },
  ];

  const current = options.find(o => o.code === currency);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-9 px-3 glass-input rounded-xl text-sm text-white hover:border-indigo-500/30 transition"
      >
        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{current?.label}</span>
        <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 glass rounded-xl shadow-2xl shadow-black/40 overflow-hidden border border-white/5 animate-scale-in z-50">
          {options.map(o => (
            <button
              key={o.code}
              onClick={() => { setCurrency(o.code); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${currency === o.code ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="font-medium">{o.label}</span>
              <span className="text-xs text-gray-600">{o.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
