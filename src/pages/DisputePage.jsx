import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import ImageUploader from '../components/ImageUploader';
import SEOTags from '../components/SEOTags';

const DISPUTE_REASONS = [
  { value: 'not_received', label: 'Товар не получен', icon: '📦' },
  { value: 'not_working', label: 'Ключ/товар не работает', icon: '🔑' },
  { value: 'wrong_item', label: 'Получен другой товар', icon: '❌' },
  { value: 'duplicate', label: 'Ключ уже использован', icon: '🔄' },
  { value: 'quality', label: 'Не соответствует описанию', icon: '📝' },
  { value: 'late_delivery', label: 'Долгая доставка', icon: '⏰' },
  { value: 'other', label: 'Другое', icon: '💬' },
];

export default function DisputePage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data.orders || data || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !reason) {
      toast.error('Выберите заказ и причину');
      return;
    }
    setSubmitting(true);
    try {
      await api.createDispute({
        order_id: parseInt(selectedOrder),
        reason,
        description,
        evidence,
      });
      toast.success('Спор создан. Мы рассмотрим вашу заявку в ближайшее время.');
      navigate('/orders');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <SEOTags title="Открыть спор" description="Форма для создания спора по заказу" />
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">⚠️</div>
        <p className="text-gray-400 text-lg mb-2">Войдите, чтобы открыть спор</p>
        <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block mt-4">На главную</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <SEOTags title="Открыть спор" description="Создайте спор по заказу на Keyzo.pro" />

      <div className="mb-6">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-400 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Назад к заказам
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Открыть спор</h1>
            <p className="text-sm text-gray-500">Опишите проблему с заказом</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Заказ *</label>
            {loading ? (
              <div className="h-11 rounded-xl bg-white/[0.02] animate-shimmer" />
            ) : orders.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-sm text-gray-500">У вас нет заказов</p>
                <Link to="/catalog" className="text-sm text-primary-400 hover:text-primary-300 transition mt-1 inline-block">Перейти в каталог</Link>
              </div>
            ) : (
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm appearance-none cursor-pointer"
                required
              >
                <option value="">Выберите заказ...</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    #{o.id} — {o.title || 'Заказ'} ({o.amount} ₽) — {new Date(o.created_at).toLocaleDateString('ru')}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Причина спора *</label>
            <div className="grid grid-cols-2 gap-2">
              {DISPUTE_REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                    reason === r.value
                      ? 'bg-primary-500/10 border-primary-500/30 text-white'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-300'
                  }`}
                >
                  <span className="text-base">{r.icon}</span>
                  <span className="text-xs font-medium">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Описание проблемы</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 glass-input rounded-xl text-white text-sm resize-none"
              placeholder="Подробно опишите проблему..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Доказательства (скриншот)</label>
            <ImageUploader value={evidence} onChange={setEvidence} />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedOrder || !reason}
            className="w-full h-12 glass-button text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                Отправка...
              </>
            ) : (
              'Открыть спор'
            )}
          </button>
        </form>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 mb-3">Информация</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-xs text-gray-500">
            <span className="text-primary-400 mt-0.5">•</span>
            Споры рассматриваются в течение 24 часов
          </li>
          <li className="flex items-start gap-2 text-xs text-gray-500">
            <span className="text-primary-400 mt-0.5">•</span>
            Приложите скриншоты для ускорения решения
          </li>
          <li className="flex items-start gap-2 text-xs text-gray-500">
            <span className="text-primary-400 mt-0.5">•</span>
            Укажите максимум деталей в описании
          </li>
        </ul>
      </div>
    </div>
  );
}
