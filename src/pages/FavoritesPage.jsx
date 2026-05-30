import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import ProductCard from '../components/ProductCard';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.getFavorites().then(setFavorites).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="text-center py-20 animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">❤️</div>
      <p className="text-gray-400 text-lg mb-4">Войдите, чтобы увидеть избранное</p>
      <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block">На главную</Link>
    </div>
  );

  if (loading) return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-64 glass-card rounded-2xl animate-shimmer"></div>)}</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-5">Избранное <span className="text-gray-500 text-lg font-normal">({favorites.length})</span></h1>
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">❤️</div>
          <p className="text-gray-400 mb-3">Избранное пусто</p>
          <Link to="/catalog" className="glass-button px-5 py-2.5 text-white text-sm font-semibold rounded-xl inline-block">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {favorites.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
