import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import OrderTimeline from '../components/OrderTimeline';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.getOrders().then(setOrders).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">📦</div>
        <p className="text-gray-400 text-lg mb-4">Войдите, чтобы увидеть заказы</p>
        <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block">На главную</Link>
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">📦</div>
        <p className="text-gray-400 text-lg mb-2">Заказов пока нет</p>
        <p className="text-gray-600 text-sm mb-4">Ваши покупки появятся здесь</p>
        <Link to="/catalog" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block">Перейти в каталог</Link>
      </div>
    );
  }

  const statusConfig = {
    pending: { color: 'amber', label: 'Ожидает', icon: '⏳' },
    completed: { color: 'emerald', label: 'Выполнен', icon: '✅' },
    cancelled: { color: 'rose', label: 'Отменён', icon: '❌' },
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-5">Мои заказы <span className="text-gray-500 text-lg font-normal">({orders.length})</span></h1>
      
      <div className="space-y-3">
        {orders.map((order, i) => {
          const status = statusConfig[order.status] || statusConfig.pending;
          return (
            <div key={order.id} className="glass-card rounded-2xl p-5" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                  {order.image ? <img src={order.image} className="w-full h-full object-cover" /> : <span className="text-xl">🎮</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${order.product_id}`} className="text-sm text-gray-200 hover:text-primary-400 transition font-medium truncate block">{order.title}</Link>
                  <p className="text-xs text-gray-500 mt-1">Продавец: {order.seller_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-white">{order.amount.toLocaleString()} ₽</span>
                  <p className="text-xs mt-1 flex items-center gap-1 justify-end">
                    <span>{status.icon}</span>
                    <span className={`text-${status.color}-400`}>{status.label}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <OrderTimeline
                  status={order.status}
                  timestamps={{
                    paid: order.created_at,
                    processing: order.processed_at,
                    delivered: order.delivered_at,
                    completed: order.completed_at,
                  }}
                />
              </div>

              {order.delivery_data && (
                <div className="mt-4 p-3 glass rounded-xl border border-white/[0.03]">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Данные для активации:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono break-all flex-1">{order.delivery_data}</code>
                    <button onClick={() => navigator.clipboard.writeText(order.delivery_data)} className="p-2 text-gray-500 hover:text-primary-400 transition rounded-lg hover:bg-white/5 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 mt-3">{new Date(order.created_at).toLocaleString('ru')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
