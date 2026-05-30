import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useLanguage } from './LanguageSwitcher';

const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 12;

export function trackProductView(product) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = list.filter(p => p.id !== product.id);
    filtered.unshift({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      region: product.region,
      rating: product.rating,
      viewed_at: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
}

export default function RecentlyViewed({ limit = 10 }) {
  const [products, setProducts] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (saved.length === 0) return;

      const ids = saved.map(p => p.id).slice(0, limit);
      try {
        const results = await Promise.allSettled(ids.map(id => api.getProduct(id)));
        const fetched = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.product || r.value);
        if (fetched.length > 0) {
          setProducts(fetched);
          return;
        }
      } catch {}

      setProducts(saved.slice(0, limit));
    } catch {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setProducts(saved.slice(0, limit));
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-accent-400">👁️</span>
          {t('recentlyViewed')}
        </h2>
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setProducts([]); }}
          className="text-xs text-gray-600 hover:text-rose-400 transition"
        >
          Очистить
        </button>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map((product, i) => (
            <Link
              key={product.id || i}
              to={`/product/${product.id}`}
              className="glass-card rounded-2xl overflow-hidden shrink-0 w-44 group hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative h-28 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-dark-900/60 to-violet-900/30 group-hover:opacity-80 transition-opacity"></div>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">🎮</div>
                )}
                {product.region && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-black/50 text-gray-300 text-[10px] font-medium backdrop-blur-sm border border-white/10">
                    {product.region}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-xs font-medium text-gray-300 group-hover:text-primary-400 transition line-clamp-2 mb-2 min-h-[32px] leading-relaxed">
                  {product.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{product.price?.toLocaleString()} ₽</span>
                  {product.rating && (
                    <span className="text-[10px] text-amber-400">⭐ {product.rating.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
