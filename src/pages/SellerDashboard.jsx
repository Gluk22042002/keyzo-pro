import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import SellerAnalyticsChart from '../components/SellerAnalyticsChart';

function ImageDropZone({ value, onChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const [dims, setDims] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { setPreview(value || ''); if (!value) setDims(null); }, [value]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        const img = new Image();
        img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      const data = await api.uploadFile(file);
      onChange(data.url);
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) { handleFile(item.getAsFile()); break; }
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
        dragOver ? 'border-primary-500 bg-primary-500/10 scale-[1.02]' : preview ? 'border-white/10 bg-white/[0.02]' : 'border-white/10 bg-white/[0.02] hover:border-primary-500/50 hover:bg-primary-500/5'
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      
      {preview ? (
        <div className="relative group">
          <img src={preview} className="w-full h-40 object-cover" onError={(e) => { setPreview(''); setDims(null); }} />
          {dims && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-2 py-1 text-center">
              <span className={`text-xs font-mono ${dims.w >= 800 && dims.h >= 600 ? 'text-emerald-400' : dims.w >= 400 ? 'text-amber-400' : 'text-rose-400'}`}>
                {dims.w}×{dims.h} px {dims.w >= 800 && dims.h >= 600 ? '✓' : dims.w >= 400 ? '⚠' : '✕'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="px-3 py-1.5 bg-white/20 backdrop-blur text-white text-xs rounded-lg hover:bg-white/30">Заменить</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(''); setDims(null); onChange(''); }} className="px-3 py-1.5 bg-rose-500/80 backdrop-blur text-white text-xs rounded-lg hover:bg-rose-500">Удалить</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          {uploading ? (
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">
            {dragOver ? 'Отпустите' : 'Перетащите или кликните'}
          </p>
        </div>
      )}
    </div>
  );
}

function ProductForm({ categories, editProduct, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', price: '', old_price: '', category_slug: 'steam',
    type: 'Ключ', region: 'Global', delivery_type: 'auto', image: '', image2: '', image3: '',
    stock_count: '1', delivery_data: ''
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (editProduct) {
      setForm({
        title: editProduct.title || '', description: editProduct.description || '', price: String(editProduct.price || ''),
        old_price: editProduct.old_price ? String(editProduct.old_price) : '', category_slug: editProduct.category_slug || 'steam',
        type: editProduct.type || 'Ключ', region: editProduct.region || 'Global', delivery_type: editProduct.delivery_type || 'auto',
        image: editProduct.image || '', image2: editProduct.image2 || '', image3: editProduct.image3 || '',
        stock_count: String(editProduct.stock_count || 1), delivery_data: editProduct.delivery_data || ''
      });
    }
  }, [editProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSubmit(form); } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const types = ['Ключ', 'Гифт', 'Подписка', 'Пополнение', 'Карта', 'Услуга', 'Аккаунт', 'Код', 'Предмет'];
  const regions = ['Global', 'RU', 'RU/CIS', 'KZ', 'TR', 'US', 'EU', 'UA'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-3xl animate-scale-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/5 bg-dark-900/95 backdrop-blur rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-white">{editProduct ? 'Редактировать товар' : 'Новый товар'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Шаг {step} из 3</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4">
          <div className="flex gap-2">
            {[1,2,3].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all ${step >= s ? 'bg-gradient-to-r from-primary-500 to-violet-500' : 'bg-white/5'}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Step 1: Photos */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Фото товара (до 3 шт.)</label>
                  <span className="text-xs text-gray-600">Рекомендуемый размер: 800×600 px</span>
                </div>
                <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10 mb-3">
                  <p className="text-xs text-primary-300 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Идеальный размер: <strong>800×600 px</strong> (4:3). Минимум: 400×300. Максимум: 2000×2000. Формат: JPG, PNG, WebP.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <ImageDropZone value={form.image} onChange={(url) => setForm({...form, image: url})} />
                    <p className="text-xs text-gray-600 text-center mt-1">Главное фото</p>
                  </div>
                  <div>
                    <ImageDropZone value={form.image2} onChange={(url) => setForm({...form, image2: url})} />
                    <p className="text-xs text-gray-600 text-center mt-1">Фото 2</p>
                  </div>
                  <div>
                    <ImageDropZone value={form.image3} onChange={(url) => setForm({...form, image3: url})} />
                    <p className="text-xs text-gray-600 text-center mt-1">Фото 3</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Название *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                  className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm" placeholder="Например: GTA V Steam RU" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4}
                  className="w-full px-4 py-3 glass-input rounded-xl text-white text-sm resize-none" placeholder="Подробное описание товара..." />
              </div>
            </div>
          )}

          {/* Step 2: Category & Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Категория *</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(c => (
                    <button key={c.id} type="button" onClick={() => setForm({...form, category_slug: c.slug})}
                      className={`p-3 rounded-xl text-left text-sm transition-all flex items-center gap-2 ${
                        form.category_slug === c.slug ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'glass-input text-gray-400 hover:text-white'
                      }`}>
                      <span className="text-lg">{c.icon}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Тип товара</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm appearance-none cursor-pointer">
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Регион</label>
                  <select value={form.region} onChange={e => setForm({...form, region: e.target.value})}
                    className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm appearance-none cursor-pointer">
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Способ доставки</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:'auto',l:'⚡ Авто',d:'Мгновенно'},{v:'gift',l:'🎁 Гифт',d:'Подарок'},{v:'manual',l:'👤 Ручная',d:'Вручную'}].map(o => (
                    <button key={o.v} type="button" onClick={() => setForm({...form, delivery_type: o.v})}
                      className={`p-3 rounded-xl text-center transition-all ${
                        form.delivery_type === o.v ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'glass-input text-gray-400 hover:text-white'
                      }`}>
                      <div className="text-sm font-medium">{o.l}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{o.d}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Price & Keys */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Цена (₽) *</label>
                  <div className="relative">
                    <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min="1"
                      className="w-full h-12 px-4 pr-8 glass-input rounded-xl text-white text-lg font-bold" placeholder="0" />
                    <span className="absolute right-4 top-3.5 text-gray-500 font-medium">₽</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Старая цена (₽)</label>
                  <div className="relative">
                    <input type="number" value={form.old_price} onChange={e => setForm({...form, old_price: e.target.value})} min="0"
                      className="w-full h-12 px-4 pr-8 glass-input rounded-xl text-white text-sm" placeholder="Не обязательно" />
                    <span className="absolute right-4 top-3.5 text-gray-500 text-sm">₽</span>
                  </div>
                  {form.old_price && form.price && Number(form.old_price) > Number(form.price) && (
                    <p className="text-xs text-emerald-400 mt-1">Скидка: {Math.round((1 - form.price / form.old_price) * 100)}%</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Количество на складе</label>
                <input type="number" value={form.stock_count} onChange={e => setForm({...form, stock_count: e.target.value})} min="0"
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm" />
              </div>
              {form.delivery_type === 'auto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ключи / Данные для доставки</label>
                  <textarea value={form.delivery_data} onChange={e => setForm({...form, delivery_data: e.target.value})} rows={4}
                    className="w-full px-4 py-3 glass-input rounded-xl text-white text-sm font-mono resize-none" 
                    placeholder="Один ключ на строку&#10;KEY-XXXX-YYYY-ZZZZ&#10;KEY-AAAA-BBBB-CCCC" />
                  <p className="text-xs text-gray-600 mt-1">Каждый ключ с новой строки. Ключи выдаются покупателям автоматически.</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="px-5 h-11 glass-input text-gray-300 rounded-xl hover:bg-white/5 text-sm font-medium">
                Назад
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="flex-1 h-11 glass-button text-white font-semibold rounded-xl text-sm">
                Далее
              </button>
            ) : (
              <button type="submit" disabled={saving} className="flex-1 h-11 glass-button text-white font-semibold rounded-xl disabled:opacity-40 text-sm">
                {saving ? 'Сохранение...' : editProduct ? 'Сохранить изменения' : 'Опубликовать товар'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'seller') { setLoading(false); return; }
    Promise.all([
      api.getCategories().then(setCategories),
      api.getSellerDashboard().then(d => { setStats(d.stats); setOrders(d.recentOrders); setReviews(d.recentReviews); }),
      api.getProducts({ seller_id: user.id, limit: 100 }).then(d => setProducts(d.products)),
      api.getSellerAnalytics(30).then(setAnalytics).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (form) => {
    if (editProduct) { await api.updateProduct(editProduct.id, form); }
    else { await api.createProduct(form); }
    const d = await api.getProducts({ seller_id: user.id, limit: 100 });
    setProducts(d.products);
    setShowForm(false);
    setEditProduct(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить товар?')) return;
    await api.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">🏪</div>
        <p className="text-gray-400 text-lg mb-2">Эта страница для продавцов</p>
        <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block">На главную</Link>
      </div>
    );
  }

  if (loading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 glass-card rounded-2xl animate-shimmer"></div>)}</div>;

  const tabs = [
    { id: 'dashboard', label: 'Обзор', icon: '📊' },
    { id: 'products', label: 'Товары', icon: '📦' },
    { id: 'orders', label: 'Заказы', icon: '🛒' },
    { id: 'reviews', label: 'Отзывы', icon: '⭐' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Панель продавца</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.username}</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="glass-button px-5 py-2.5 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Добавить товар
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-xl w-fit overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${tab === t.id ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm categories={categories} editProduct={editProduct} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditProduct(null); }} />
      )}

      {/* Dashboard */}
      {tab === 'dashboard' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Товаров', value: stats.total_products, icon: '📦' },
              { label: 'Продаж', value: stats.total_sales?.toLocaleString() || 0, icon: '💰' },
              { label: 'Доход', value: `${Number(stats.total_revenue || 0).toLocaleString()} ₽`, icon: '💳' },
              { label: 'Рейтинг', value: Number(stats.avg_rating || 0).toFixed(1), icon: '⭐' },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2"><span className="text-xl">{s.icon}</span><span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{s.label}</span></div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Analytics Chart */}
          <SellerAnalyticsChart analytics={analytics} />

          <div className="grid md:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Последние заказы</h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <span className="text-xs text-gray-500 w-16 shrink-0">{new Date(o.created_at).toLocaleDateString('ru')}</span>
                    <span className="text-sm text-gray-300 truncate flex-1">{o.title}</span>
                    <span className="text-sm text-accent-400 font-medium">{Number(o.amount || 0)} ₽</span>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-sm text-gray-600 text-center py-4">Заказов пока нет</p>}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Последние отзывы</h3>
              <div className="space-y-2">
                {reviews.slice(0, 5).map(r => (
                  <div key={r.id} className="p-2 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-white font-medium">{r.buyer_name}</span>
                      <span className="text-xs text-amber-400">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{r.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && <p className="text-sm text-gray-600 text-center py-4">Отзывов пока нет</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      {tab === 'products' && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-400 mb-3">Нет товаров</p>
              <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="glass-button px-5 py-2.5 text-white text-sm font-semibold rounded-xl">Добавить первый товар</button>
            </div>
          ) : products.map((p, i) => (
            <div key={p.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-xl">🎮</span>}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${p.id}`} className="text-sm text-gray-200 hover:text-primary-400 transition font-medium truncate block">{p.title}</Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{p.category_name || p.category_slug}</span>
                  <span className="text-xs text-gray-700">·</span>
                  <span className="text-xs text-gray-500">{p.region}</span>
                  <span className="text-xs text-gray-700">·</span>
                  <span className={`text-xs ${p.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>{p.is_active ? 'В наличии' : 'Скрыт'}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-white">{Number(p.price || 0).toLocaleString()} ₽</div>
                <div className="text-xs text-gray-500">{p.sold_count || 0} продаж</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="p-2 text-gray-500 hover:text-primary-400 transition rounded-lg hover:bg-white/5" title="Редактировать">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-rose-400 transition rounded-lg hover:bg-white/5" title="Удалить">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl"><div className="text-4xl mb-3">🛒</div><p className="text-gray-400">Заказов пока нет</p></div>
          ) : orders.map((o, i) => (
            <div key={o.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                {o.image ? <img src={o.image} className="w-full h-full object-cover" /> : <span className="text-lg">🎮</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{o.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">Покупатель: {o.buyer_name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-accent-400">+{Number(o.amount || 0)} ₽</span>
                <p className="text-xs text-gray-600">{new Date(o.created_at).toLocaleDateString('ru')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl"><div className="text-4xl mb-3">⭐</div><p className="text-gray-400">Отзывов пока нет</p></div>
          ) : reviews.map((r, i) => (
            <div key={r.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-primary-400 text-xs font-bold">{r.buyer_name?.[0]?.toUpperCase()}</div>
                <div>
                  <span className="text-sm text-white font-medium">{r.buyer_name}</span>
                  <span className="text-xs text-amber-400 ml-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <span className="text-xs text-gray-600 ml-auto">{new Date(r.created_at).toLocaleDateString('ru')}</span>
              </div>
              {r.product_title && <p className="text-xs text-gray-500 mb-1">Товар: {r.product_title}</p>}
              <p className="text-sm text-gray-400">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
