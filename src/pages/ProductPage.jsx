import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import VideoPlayer from '../components/VideoPlayer';
import ProductBundle from '../components/ProductBundle';

function StarRating({ rating, size = 'sm', interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => interactive && onChange?.(i)} className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${interactive ? 'cursor-pointer' : 'cursor-default'} transition ${i <= rating ? 'text-amber-400' : 'text-gray-700'}`}>
          <svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductPage({ onAuthClick }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [deliveryData, setDeliveryData] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    api.getProduct(id).then(p => { setProduct(p); setIsFavorite(p.is_favorite); }).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) return onAuthClick();
    try {
      const data = await api.toggleFavorite(product.id);
      setIsFavorite(data.is_favorite);
    } catch (err) { console.error(err); }
  };

  const handleBuy = async () => {
    if (!user) return onAuthClick();
    setBuying(true);
    try {
      const data = await api.createOrder(product.id);
      setBought(true);
      setDeliveryData(data.delivery);
    } catch (err) {
      alert(err.message);
    } finally {
      setBuying(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await api.addReview(product.id, reviewRating, reviewComment);
      const updated = await api.getProduct(id);
      setProduct(updated);
      setShowReviewForm(false);
      setReviewComment('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddBundle = async (rule) => {
    if (!user) return onAuthClick();
    try {
      await api.addToCart(product.id);
      navigate('/cart');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-6 bg-white/[0.03] rounded-lg w-1/3"></div>
      <div className="h-80 glass-card rounded-2xl animate-shimmer"></div>
    </div>
  );
  
  if (!product) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">😔</div>
      <p className="text-gray-400 text-lg">Товар не найден</p>
    </div>
  );

  const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-white transition">Главная</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-white transition">Каталог</Link>
        <span>/</span>
        {product.category_name && <><Link to={`/catalog/${product.category_slug}`} className="hover:text-white transition">{product.category_name}</Link><span>/</span></>}
        <span className="text-gray-300 truncate">{product.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Image + Description */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image Gallery */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-primary-900/20 via-dark-900 to-violet-900/20">
              {(() => {
                const images = [product.image, product.image2, product.image3].filter(Boolean);
                const currentImg = images[activeImage] || product.image;
                return currentImg ? (
                  <img src={currentImg} alt={product.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl opacity-30">🎮</div>
                );
              })()}
              {discount > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-rose-500/90 text-white text-sm font-bold backdrop-blur-sm">-{discount}%</div>
              )}
              {product.image_width && (
                <div className="absolute bottom-4 right-4 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-gray-300 font-mono">
                  {product.image_width}×{product.image_height}
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {(() => {
              const images = [product.image, product.image2, product.image3].filter(Boolean);
              if (images.length <= 1) return null;
              return (
                <div className="flex gap-2 p-3">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Video Player */}
          {product.video_url && <VideoPlayer url={product.video_url} />}

          {/* Description */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">Описание</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="tag tag-primary">Регион: {product.region}</span>
              <span className="tag tag-accent">Тип: {product.type}</span>
              <span className="tag tag-green">Доставка: {product.delivery_type === 'auto' ? 'Автоматическая' : 'Ручная'}</span>
            </div>
          </div>

          {/* Reviews */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Отзывы ({product.reviews?.length || 0})</h2>
              {user && (
                <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-sm text-primary-400 hover:text-primary-300 transition font-medium">
                  {showReviewForm ? 'Скрыть' : 'Написать отзыв'}
                </button>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={handleReview} className="mb-5 p-5 glass rounded-2xl space-y-3 border border-white/5 animate-scale-in">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Оценка:</span>
                  <StarRating rating={reviewRating} size="md" interactive onChange={setReviewRating} />
                </div>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Ваш отзыв..." className="w-full h-24 px-4 py-3 glass-input rounded-xl text-sm text-white placeholder-gray-600 resize-none" />
                <button type="submit" className="glass-button px-5 py-2.5 text-white text-sm font-semibold rounded-xl">Отправить</button>
              </form>
            )}

            <div className="space-y-3">
              {product.reviews?.length > 0 ? product.reviews.map(r => (
                <div key={r.id} className="p-4 glass rounded-xl border border-white/[0.03]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-primary-400 text-xs font-bold">{r.buyer_name?.[0]?.toUpperCase()}</div>
                    <div>
                      <span className="text-sm text-white font-medium">{r.buyer_name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={r.rating} />
                        <span className="text-xs text-gray-600">{new Date(r.created_at).toLocaleDateString('ru')}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{r.comment}</p>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-sm text-gray-500">Пока нет отзывов</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Buy Card */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6 sticky top-20">
            {/* Title */}
            <h1 className="text-xl font-bold text-white mb-3 leading-snug">{product.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating} size="md" />
              <span className="text-sm text-gray-400 font-medium">{product.rating?.toFixed(1)}</span>
              <span className="text-sm text-gray-600">·</span>
              <span className="text-sm text-gray-500">{product.reviews_count} отзывов</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-black text-white">{product.price.toLocaleString()} ₽</span>
              {product.old_price && (
                <span className="text-lg text-gray-500 line-through">{product.old_price.toLocaleString()} ₽</span>
              )}
            </div>
            {discount > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                Экономия {Math.round((1 - product.price / product.old_price) * 100)}%
              </div>
            )}

            {/* Buy / Success */}
            {bought ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-scale-in">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-emerald-400 font-semibold text-sm">Покупка успешна!</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20">
                  <p className="text-white text-sm font-mono break-all">{deliveryData}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Скопируйте и активируйте</p>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <button onClick={handleBuy} disabled={buying} className="flex-1 h-12 glass-button text-white font-bold rounded-xl disabled:opacity-40">
                  {buying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      Обработка...
                    </span>
                  ) : 'Купить'}
                </button>
                <button onClick={toggleFavorite} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isFavorite ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'glass-input text-gray-500 hover:text-rose-400'}`} title={isFavorite ? 'Убрать из избранного' : 'В избранное'}>
                  <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </button>
              </div>
            )}

            {/* Features */}
            <div className="space-y-2.5 mb-5">
              {[
                { icon: '⚡', text: 'Мгновенная доставка', color: 'emerald' },
                { icon: '🔒', text: 'Безопасная сделка', color: 'emerald' },
                { icon: product.delivery_type === 'auto' ? '🤖' : '👤', text: product.delivery_type === 'auto' ? 'Автоматическая выдача' : 'Ручная выдача', color: 'emerald' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>

            {/* Seller */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-gray-600 mb-2.5 uppercase tracking-wider font-medium">Продавец</p>
              <Link to={`/seller/${product.seller_id}`} className="flex items-center gap-3 group hover:bg-white/5 p-2 -m-2 rounded-xl transition">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-primary-400 text-sm font-bold">{product.seller_name?.[0]?.toUpperCase()}</div>
                <div>
                  <p className="text-sm text-white font-semibold group-hover:text-primary-400 transition">{product.seller_name}</p>
                  <p className="text-xs text-gray-500">{product.sales?.toLocaleString()} продаж · ⭐ {product.rating?.toFixed(1)}</p>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-400 ml-auto transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </Link>
              {user && user.id !== product.seller_id && (
                <Link to={`/messages/${product.seller_id}`} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm text-gray-300 hover:text-white hover:border-primary-500/30 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Написать продавцу
                </Link>
              )}
            </div>
          </div>

          {/* Bundle Section */}
          <ProductBundle product={product} onAddBundle={handleAddBundle} />
        </div>
      </div>
    </div>
  );
}
