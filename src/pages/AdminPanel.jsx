import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

export default function AdminPanel() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [promos, setPromos] = useState([]);
  const [promoForm, setPromoForm] = useState({ code: '', discount: '', type: 'percent', max_uses: '', expires_at: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { setLoading(false); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, productsRes, ordersRes, disputesRes, promosRes] = await Promise.allSettled([
        api.adminStats(),
        api.adminUsers(),
        api.adminProducts(),
        api.adminOrders(),
        api.adminDisputes(),
        api.adminPromos(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.products || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders || []);
      if (disputesRes.status === 'fulfilled') setDisputes(disputesRes.value.disputes || []);
      if (promosRes.status === 'fulfilled') setPromos(promosRes.value.promos || []);
    } catch (err) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    if (!confirm('Забанить пользователя?')) return;
    try {
      await api.banUser(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, banned: !u.banned } : u));
      toast.success('Пользователь обновлён');
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Товар удалён');
    } catch (err) { toast.error(err.message); }
  };

  const handleResolveDispute = async (disputeId, status) => {
    try {
      await api.resolveDispute(disputeId, status);
      setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status } : d));
      toast.success('Спор обновлён');
    } catch (err) { toast.error(err.message); }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPromo(promoForm);
      setPromos([res.promo, ...promos]);
      setPromoForm({ code: '', discount: '', type: 'percent', max_uses: '', expires_at: '' });
      toast.success('Промокод создан');
    } catch (err) { toast.error(err.message); }
  };

  const handleDeletePromo = async (promoId) => {
    try {
      await api.deletePromo(promoId);
      setPromos(promos.filter(p => p.id !== promoId));
      toast.success('Промокод удалён');
    } catch (err) { toast.error(err.message); }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">⚙️</div>
        <p className="text-gray-400 text-lg mb-2">Доступ запрещён</p>
        <p className="text-gray-600 text-sm mb-4">Эта страница только для администраторов</p>
        <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block">На главную</Link>
      </div>
    );
  }

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-shimmer" />)}
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Обзор', icon: '📊' },
    { id: 'users', label: 'Пользователи', icon: '👥' },
    { id: 'products', label: 'Товары', icon: '📦' },
    { id: 'orders', label: 'Заказы', icon: '🛒' },
    { id: 'disputes', label: 'Споры', icon: '⚠️' },
    { id: 'promos', label: 'Промокоды', icon: '🎫' },
  ];

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Панель администратора</h1>
        <span className="tag tag-primary">Admin</span>
      </div>

      <div className="flex gap-1 mb-6 p-1 glass rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearchQuery(''); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${tab === t.id ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Пользователей', value: stats.total_users ?? users.length, icon: '👥' },
              { label: 'Товаров', value: stats.total_products ?? products.length, icon: '📦' },
              { label: 'Заказов', value: stats.total_orders ?? orders.length, icon: '🛒' },
              { label: 'Доход', value: `${(stats.total_revenue ?? 0).toLocaleString()} ₽`, icon: '💰' },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{s.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Последние заказы</h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <span className="text-xs text-gray-500 w-16 shrink-0">{new Date(o.created_at).toLocaleDateString('ru')}</span>
                    <span className="text-sm text-gray-300 truncate flex-1">{o.title || `Заказ #${o.id}`}</span>
                    <span className="text-sm text-accent-400 font-medium">{o.amount} ₽</span>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-sm text-gray-600 text-center py-4">Заказов пока нет</p>}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Открытые споры</h3>
              <div className="space-y-2">
                {disputes.filter(d => d.status === 'open').slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <span className="text-xs text-rose-400 shrink-0">●</span>
                    <span className="text-sm text-gray-300 truncate flex-1">{d.reason || `Спор #${d.id}`}</span>
                    <button onClick={() => setTab('disputes')} className="text-xs text-primary-400 hover:text-primary-300">Подробнее</button>
                  </div>
                ))}
                {disputes.filter(d => d.status === 'open').length === 0 && <p className="text-sm text-gray-600 text-center py-4">Нет открытых споров</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
          />
          <div className="space-y-2">
            {filteredUsers.map((u, i) => (
              <div key={u.id} className="glass-card rounded-2xl p-4 flex items-center gap-4" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-primary-400 text-sm font-bold shrink-0">
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{u.username}</span>
                    {u.role === 'admin' && <span className="tag tag-red text-[10px]">Admin</span>}
                    {u.role === 'seller' && <span className="tag tag-accent text-[10px]">Seller</span>}
                    {u.banned && <span className="tag tag-red text-[10px]">Забанен</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{new Date(u.created_at).toLocaleDateString('ru')}</span>
                <div className="flex gap-1 shrink-0">
                  {u.id !== user.id && (
                    <button onClick={() => handleBanUser(u.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${u.banned ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'}`}>
                      {u.banned ? 'Разбанить' : 'Забанить'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4 animate-fade-in">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск товаров..."
            className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
          />
          <div className="space-y-2">
            {filteredProducts.map((p, i) => (
              <div key={p.id} className="glass-card rounded-2xl p-4 flex items-center gap-4" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-lg">🎮</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p.id}`} className="text-sm text-gray-200 hover:text-primary-400 transition font-medium truncate block">{p.title}</Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{p.category_slug}</span>
                    <span className="text-xs text-gray-700">·</span>
                    <span className="text-xs text-gray-500">{p.seller_name || 'Продавец'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-white">{p.price?.toLocaleString()} ₽</div>
                  <div className={`text-xs ${p.in_stock ? 'text-emerald-400' : 'text-rose-400'}`}>{p.in_stock ? 'В наличии' : 'Нет'}</div>
                </div>
                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-500 hover:text-rose-400 transition rounded-lg hover:bg-white/5 shrink-0" title="Удалить">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3 animate-fade-in">
          {orders.length === 0 ? (
            <div className="text-center py-16"><div className="text-4xl mb-3">🛒</div><p className="text-gray-400">Заказов пока нет</p></div>
          ) : orders.map((o, i) => (
            <div key={o.id} className="glass-card rounded-2xl p-4 flex items-center gap-4" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                {o.image ? <img src={o.image} className="w-full h-full object-cover" /> : <span className="text-lg">🎮</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{o.title || `Заказ #${o.id}`}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">Покупатель: {o.buyer_name || '—'}</span>
                  <span className="text-xs text-gray-700">·</span>
                  <span className="text-xs text-gray-500">Продавец: {o.seller_name || '—'}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-white">{o.amount} ₽</span>
                <p className="text-xs text-gray-600">{new Date(o.created_at).toLocaleDateString('ru')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'disputes' && (
        <div className="space-y-3 animate-fade-in">
          {disputes.length === 0 ? (
            <div className="text-center py-16"><div className="text-4xl mb-3">⚠️</div><p className="text-gray-400">Споров пока нет</p></div>
          ) : disputes.map((d, i) => (
            <div key={d.id} className="glass-card rounded-2xl p-5" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`tag text-xs ${d.status === 'open' ? 'tag-red' : d.status === 'resolved' ? 'tag-green' : 'tag-primary'}`}>
                      {d.status === 'open' ? 'Открыт' : d.status === 'resolved' ? 'Решён' : d.status === 'rejected' ? 'Отклонён' : d.status}
                    </span>
                    <span className="text-xs text-gray-600">#{d.id}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{d.reason || 'Причина не указана'}</p>
                  <p className="text-xs text-gray-500">{d.description || ''}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-600">Заказ: {d.order_id}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-600">{new Date(d.created_at).toLocaleDateString('ru')}</span>
                  </div>
                </div>
                {d.status === 'open' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleResolveDispute(d.id, 'resolved')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition">Решить</button>
                    <button onClick={() => handleResolveDispute(d.id, 'rejected')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition">Отклонить</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'promos' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Создать промокод</h3>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Код *</label>
                  <input type="text" value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} required className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm uppercase" placeholder="SALE20" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Тип скидки *</label>
                  <select value={promoForm.type} onChange={e => setPromoForm({...promoForm, type: e.target.value})} className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm appearance-none cursor-pointer">
                    <option value="percent">Процент (%)</option>
                    <option value="fixed">Фиксированная (₽)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Значение *</label>
                  <input type="number" value={promoForm.discount} onChange={e => setPromoForm({...promoForm, discount: e.target.value})} required min="1" className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm" placeholder={promoForm.type === 'percent' ? '10' : '100'} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Макс. использований</label>
                  <input type="number" value={promoForm.max_uses} onChange={e => setPromoForm({...promoForm, max_uses: e.target.value})} min="1" className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Дата окончания</label>
                <input type="datetime-local" value={promoForm.expires_at} onChange={e => setPromoForm({...promoForm, expires_at: e.target.value})} className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm" />
              </div>
              <button type="submit" className="glass-button px-6 py-2.5 text-white text-sm font-semibold rounded-xl">Создать промокод</button>
            </form>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400">Активные промокоды</h3>
            {promos.length === 0 ? (
              <div className="text-center py-10"><p className="text-gray-600 text-sm">Промокодов пока нет</p></div>
            ) : promos.map((p, i) => (
              <div key={p.id} className="glass-card rounded-2xl p-4 flex items-center gap-4" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">🎫</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white font-mono">{p.code}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {p.type === 'percent' ? `${p.discount}%` : `${p.discount} ₽`}
                    </span>
                    <span className="text-xs text-gray-700">·</span>
                    <span className="text-xs text-gray-500">Использований: {p.used_count || 0}/{p.max_uses || '∞'}</span>
                  </div>
                  {p.expires_at && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      До: {new Date(p.expires_at).toLocaleDateString('ru')}
                    </p>
                  )}
                </div>
                <button onClick={() => handleDeletePromo(p.id)} className="p-2 text-gray-500 hover:text-rose-400 transition rounded-lg hover:bg-white/5 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
