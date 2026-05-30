import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function QuickView({ productId, onClose, onAuthClick }) {
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    api.getProduct(productId).then(setProduct).finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleBuy = async () => {
    if (!user) return onAuthClick?.();
    setBuying(true);
    try {
      await api.createOrder(product.id);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-lg glass-card rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-56 bg-white/[0.03] rounded-xl animate-shimmer" />
            <div className="h-5 bg-white/[0.05] rounded-lg w-3/4" />
            <div className="h-4 bg-white/[0.05] rounded-lg w-1/2" />
          </div>
        ) : product ? (
          <div>
            <div className="relative h-56 overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-dark-900/60 to-violet-900/30" />
              {product.image ? (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">🎮</div>
              )}
              <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white line-clamp-2">{product.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Продавец: {product.seller_name}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <span className="text-xs text-gray-400 font-medium">{Number(product.rating || 0).toFixed(1)}</span>
                </div>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-500">{product.reviews_count || 0} отзывов</span>
                <span className="text-gray-700">·</span>
                <span className={`text-xs font-medium ${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {product.stock > 0 ? `В наличии (${product.stock})` : 'Нет в наличии'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{Number(product.price || 0).toLocaleString()} ₽</span>
                {product.old_price && <span className="text-sm text-gray-500 line-through">{Number(product.old_price).toLocaleString()} ₽</span>}
              </div>

              <button onClick={handleBuy} disabled={buying || product.stock <= 0} className="w-full h-11 glass-button text-white font-bold rounded-xl disabled:opacity-40 transition-all duration-300">
                {buying ? 'Обработка...' : product.stock > 0 ? 'Купить' : 'Нет в наличии'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">Товар не найден</div>
        )}
      </div>
    </div>
  );
}
