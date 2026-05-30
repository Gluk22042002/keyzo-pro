import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import SteamTopup from '../components/SteamTopup';
import SkeletonLoader from '../components/SkeletonLoader';
import BackToTop from '../components/BackToTop';
import FlashSaleBanner from '../components/FlashSaleBanner';
import NewsletterForm from '../components/NewsletterForm';
import SupportChatbot from '../components/SupportChatbot';
import { BlogPreview } from '../pages/BlogPage';

export default function HomePage({ onAuthClick }) {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newest, setNewest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getProducts({ featured: '1', limit: 8 }),
      api.getProducts({ sort: 'popular', limit: 8 }),
      api.getProducts({ sort: 'newest', limit: 4 }),
    ]).then(([cats, feat, pop, nw]) => {
      setCategories(cats);
      setFeatured(feat.products);
      setPopular(pop.products);
      setNewest(nw.products);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 pt-4">
      {/* Hero + Steam Topup */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6 pt-4 sm:pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm text-gray-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              15,000+ товаров · Работаем 24/7
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Маркетплейс
              <br />
              <span className="text-gradient">цифровых</span>
              <br />
              товаров
            </h1>

            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              Быстрые покупки, безопасные сделки. Игры, ключи, подписки, пополнение Steam — всё в одном месте.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/catalog" className="inline-flex items-center gap-2 h-12 px-6 glass-button text-white font-semibold rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                Каталог
              </Link>
              <Link to="/catalog?sort=cheapest" className="inline-flex items-center gap-2 h-12 px-6 glass-input text-white font-semibold rounded-xl hover:bg-white/5 transition">
                Скидки до -50%
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { value: '15K+', label: 'Товаров' },
                { value: '50K+', label: 'Покупок' },
                { value: '4.9', label: 'Рейтинг' },
              ].map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-slide-up">
            <SteamTopup onAuthClick={onAuthClick} />
          </div>
        </div>
      </section>

      {/* Flash Sale Banner */}
      <FlashSaleBanner />

      {/* Categories */}
      {loading ? (
        <section>
          <div className="h-6 bg-white/[0.05] rounded-lg w-32 mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 animate-shimmer h-20" />
            ))}
          </div>
        </section>
      ) : (
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Категории</h2>
            <Link to="/catalog" className="text-sm text-primary-400 hover:text-primary-300 transition font-medium">Все →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((cat, i) => (
              <Link key={cat.id} to={`/catalog/${cat.slug}`} className="glass-card rounded-2xl p-4 flex items-center gap-3 group" style={{ animationDelay: `${i * 50}ms` }}>
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-sm text-gray-400 group-hover:text-white transition font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {loading ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-6 bg-white/[0.05] rounded-lg w-40 mb-1" />
              <div className="h-4 bg-white/[0.03] rounded-lg w-56" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <SkeletonLoader key={i} type="card" />)}
          </div>
        </section>
      ) : featured.length > 0 ? (
        <section className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Хиты продаж</h2>
              <p className="text-sm text-gray-500 mt-0.5">Самые популярные товары</p>
            </div>
            <Link to="/catalog?sort=popular" className="text-sm text-primary-400 hover:text-primary-300 transition font-medium">Все →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      ) : null}

      {/* Popular */}
      {loading ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-6 bg-white/[0.05] rounded-lg w-36 mb-1" />
              <div className="h-4 bg-white/[0.03] rounded-lg w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <SkeletonLoader key={i} type="card" />)}
          </div>
        </section>
      ) : popular.length > 0 ? (
        <section className="animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Популярные</h2>
              <p className="text-sm text-gray-500 mt-0.5">Больше всего продаж</p>
            </div>
            <Link to="/catalog?sort=popular" className="text-sm text-primary-400 hover:text-primary-300 transition font-medium">Все →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popular.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      ) : null}

      {/* Blog Preview */}
      <BlogPreview />

      {/* Newsletter */}
      <NewsletterForm />

      {/* CTA Banner */}
      <section className="relative overflow-hidden rounded-3xl animate-slide-up" style={{ animationDelay: '800ms' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-violet-600/20 to-accent-600/20"></div>
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="relative p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Стань продавцом</h2>
            <p className="text-gray-400 max-w-md">Добавляй товары, продавай цифровые продукты. Низкая комиссия, быстрые выплаты, тысячи покупателей.</p>
          </div>
          <Link to="/seller" className="glass-button px-8 py-3.5 text-white font-semibold rounded-xl flex items-center gap-2 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            Начать продавать
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <span className="font-bold text-white">Keyzo.pro</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">Маркетплейс цифровых товаров для геймеров и не только.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Покупателям</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/catalog" className="hover:text-gray-300 transition">Каталог</Link></li>
              <li><span className="hover:text-gray-300 transition cursor-pointer">Как купить</span></li>
              <li><span className="hover:text-gray-300 transition cursor-pointer">Возврат средств</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Продавцам</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="hover:text-gray-300 transition cursor-pointer">Стать продавцом</span></li>
              <li><span className="hover:text-gray-300 transition cursor-pointer">Правила</span></li>
              <li><span className="hover:text-gray-300 transition cursor-pointer">Комиссия</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Контакты</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="hover:text-gray-300 transition cursor-pointer">Поддержка</span></li>
              <li><span className="hover:text-gray-300 transition cursor-pointer">Telegram</span></li>
              <li><span className="hover:text-gray-300 transition cursor-pointer">Discord</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">© 2026 Keyzo.pro. Все права защищены.</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <span className="hover:text-gray-400 transition cursor-pointer">Оферта</span>
            <span className="hover:text-gray-400 transition cursor-pointer">Конфиденциальность</span>
          </div>
        </div>
      </footer>

      <BackToTop />
      <SupportChatbot />
    </div>
  );
}
