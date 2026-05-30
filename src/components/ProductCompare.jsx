import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageSwitcher';

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('compare_list') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('compare_list', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = useCallback((product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= 4) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback((productId) => {
    return compareList.some(p => p.id === productId);
  }, [compareList]);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);

export function CompareButton({ product, compact = false }) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(product.id);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={`p-1.5 rounded-lg transition text-xs ${inCompare ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
        title={inCompare ? 'Убрать из сравнения' : 'Сравнить'}
      >
        {inCompare ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`glass-button px-3 py-1.5 text-xs font-semibold rounded-xl transition ${inCompare ? 'bg-primary-500/30 text-primary-300 border-primary-500/30' : ''}`}
    >
      {inCompare ? '✓ В сравнении' : '⚖️ Сравнить'}
    </button>
  );
}

export default function ProductCompare({ onClose }) {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { t } = useLanguage();

  if (compareList.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center animate-scale-in">
        <div className="text-4xl mb-4">⚖️</div>
        <p className="text-gray-400 text-lg mb-2">{t('noItems')}</p>
        <p className="text-gray-600 text-sm mb-4">Добавьте товары для сравнения</p>
        {onClose && (
          <button onClick={onClose} className="glass-button px-5 py-2 text-white text-sm font-semibold rounded-xl">
            {t('back')}
          </button>
        )}
      </div>
    );
  }

  const fields = [
    { key: 'price', label: t('price'), render: (p) => `${p.price?.toLocaleString()} ₽` },
    { key: 'rating', label: t('rating'), render: (p) => `⭐ ${p.rating?.toFixed(1) || '—'}` },
    { key: 'reviews_count', label: t('reviews'), render: (p) => p.reviews_count || 0 },
    { key: 'sales', label: t('sales'), render: (p) => p.sales || 0 },
    { key: 'region', label: 'Регион', render: (p) => p.region || '—' },
    { key: 'delivery_type', label: 'Доставка', render: (p) => p.delivery_type === 'auto' ? '⚡ Автоматическая' : '👤 Ручная' },
    { key: 'seller_name', label: 'Продавец', render: (p) => p.seller_name || '—' },
    { key: 'category_slug', label: 'Категория', render: (p) => p.category_slug || '—' },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">Сравнение ({compareList.length})</h2>
        <div className="flex items-center gap-2">
          <button onClick={clearCompare} className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition">
            Очистить
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition rounded-lg hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left p-3 text-xs text-gray-500 uppercase tracking-wider font-medium w-40">Параметр</th>
              {compareList.map(p => (
                <th key={p.id} className="p-3 text-center min-w-[150px]">
                  <div className="flex flex-col items-center gap-2">
                    <Link to={`/product/${p.id}`} className="relative group">
                      <div className="w-16 h-16 rounded-xl bg-white/[0.03] flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary-500/30 transition">
                        {p.image ? (
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🎮</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); removeFromCompare(p.id); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </Link>
                    <Link to={`/product/${p.id}`} className="text-sm text-gray-200 hover:text-primary-400 transition font-medium line-clamp-2 text-center leading-tight">
                      {p.title}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr key={field.key} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                <td className="p-3 text-sm text-gray-400 font-medium">{field.label}</td>
                {compareList.map(p => (
                  <td key={p.id} className="p-3 text-center text-sm text-gray-200">
                    {field.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
