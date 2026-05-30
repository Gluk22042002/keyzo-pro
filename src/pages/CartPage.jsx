import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function CartPage({ onAuthClick }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.getCart().then(setCart).finally(() => setLoading(false));
  }, [user]);

  const removeItem = async (productId) => {
    await api.removeFromCart(productId);
    setCart(cart.filter(i => i.product_id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  if (!user) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">🛒</div>
        <p className="text-gray-400 text-lg mb-4">Войдите, чтобы увидеть корзину</p>
        <button onClick={onAuthClick} className="glass-button px-6 py-3 text-white font-semibold rounded-xl">Войти</button>
      </div>
    );
  }

  if (loading) return (
    <div className="space-y-3">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="h-24 glass-card rounded-2xl animate-shimmer"></div>
      ))}
    </div>
  );

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">🛒</div>
        <p className="text-gray-400 text-lg mb-2">Корзина пуста</p>
        <p className="text-gray-600 text-sm mb-4">Добавьте товары из каталога</p>
        <Link to="/catalog" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block">Перейти в каталог</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-5">Корзина <span className="text-gray-500 text-lg font-normal">({cart.length})</span></h1>
      
      <div className="space-y-3 mb-5">
        {cart.map((item, i) => (
          <div key={item.id} className="glass-card rounded-2xl p-4 flex items-center gap-4" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-16 h-16 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
              {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="text-2xl">🎮</span>}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.product_id}`} className="text-sm text-gray-200 hover:text-primary-400 transition font-medium truncate block">{item.title}</Link>
              <p className="text-xs text-gray-500 mt-1">{item.delivery_type === 'auto' ? '⚡ Автовыдача' : '📦 Ручная выдача'}</p>
            </div>
            <span className="text-sm font-bold text-white shrink-0">{item.price.toLocaleString()} ₽</span>
            <button onClick={() => removeItem(item.product_id)} className="p-2 text-gray-600 hover:text-rose-400 transition rounded-xl hover:bg-white/5 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Итого:</span>
          <span className="text-2xl font-black text-white">{total.toLocaleString()} ₽</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Баланс: {user.balance?.toFixed(0) || 0} ₽</span>
          {user.balance < total && <span className="text-rose-400 text-xs">Недостаточно средств</span>}
        </div>
      </div>
    </div>
  );
}
