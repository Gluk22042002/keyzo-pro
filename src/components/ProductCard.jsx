import { Link } from 'react-router-dom';

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}

export default function ProductCard({ product, index = 0 }) {
  const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  return (
    <Link to={`/product/${product.id}`} className="block glass-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-200" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-900/40 via-dark-900/60 to-violet-900/30">
        {product.image ? (
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🎮</div>
        )}
        {discount > 0 && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-rose-500/90 text-white text-xs font-bold">-{discount}%</div>
        )}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/50 text-gray-300 text-xs font-medium border border-white/10">{product.region}</div>
        <div className="absolute bottom-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${product.delivery_type === 'auto' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {product.delivery_type === 'auto' ? '⚡ Авто' : '👤 Ручн.'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 mb-2 min-h-[40px]">{product.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-xs text-gray-400 font-medium">{Number(product.rating || 0).toFixed(1)}</span>
          </div>
          <span className="text-gray-700">·</span>
          <span className="text-xs text-gray-500">{formatNumber(product.reviews_count || 0)} отзывов</span>
          <span className="text-gray-700">·</span>
          <span className="text-xs text-accent-400 font-medium">{formatNumber(product.sales || 0)} продаж</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">{Number(product.price || 0).toLocaleString()} ₽</span>
          {product.old_price && <span className="text-sm text-gray-500 line-through">{Number(product.old_price).toLocaleString()} ₽</span>}
        </div>
      </div>
    </Link>
  );
}
