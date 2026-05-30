import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSeller(id).then(setSeller),
      api.getProducts({ seller_id: id, limit: 50 }).then(d => setProducts(d.products)),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 glass-card rounded-2xl animate-shimmer"></div>)}</div>;
  if (!seller) return <div className="text-center py-20"><p className="text-gray-400">Продавец не найден</p></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Seller Info */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-primary-500/20">{seller.username[0].toUpperCase()}</div>
          <div>
            <h1 className="text-xl font-bold text-white">{seller.username}</h1>
            <p className="text-sm text-gray-500">На marketplace с {new Date(seller.created_at).toLocaleDateString('ru')}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/5">
          {[
            { label: 'Товаров', value: seller.products },
            { label: 'Продаж', value: seller.total_sales?.toLocaleString() },
            { label: 'Рейтинг', value: `⭐ ${seller.avg_rating}` },
            { label: 'Отзывов', value: seller.reviews_count },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {seller.reviews?.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Отзывы ({seller.reviews.length})</h2>
          <div className="space-y-3">
            {seller.reviews.slice(0, 5).map(r => (
              <div key={r.id} className="p-3 glass rounded-xl border border-white/[0.03]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white font-medium">{r.buyer_name}</span>
                  <span className="text-xs text-amber-400">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-sm text-gray-400">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Товары продавца ({products.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {products.length === 0 && <p className="text-gray-500 text-center py-8">Товаров пока нет</p>}
      </div>
    </div>
  );
}
