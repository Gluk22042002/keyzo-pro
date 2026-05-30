import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import PriceFilter from '../components/PriceFilter';
import ProductTags from '../components/ProductTags';
import QuickView from '../components/QuickView';
import InfiniteScroll from '../components/InfiniteScroll';
import { SkeletonProductCard } from '../components/SkeletonLoader';
import CurrencySwitcher from '../components/CurrencySwitcher';
import DragToCart, { CartDropZone } from '../components/DragToCart';

export default function CatalogPage() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [quickViewId, setQuickViewId] = useState(null);
  const [cartHighlight, setCartHighlight] = useState(false);
  const search = searchParams.get('search') || '';

  useEffect(() => { api.getCategories().then(setCategories); }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const params = { page: 1, limit: 16, sort };
    if (category) params.category = category;
    if (search) params.search = search;
    if (priceRange.min > 0) params.price_min = priceRange.min;
    if (priceRange.max < 100000) params.price_max = priceRange.max;
    api.getProducts(params).then(d => { setProducts(d.products); setTotal(d.total); }).finally(() => setLoading(false));
  }, [category, sort, search, priceRange]);

  const loadMore = () => {
    if (loadingMore || products.length >= total) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const params = { page: nextPage, limit: 16, sort };
    if (category) params.category = category;
    if (search) params.search = search;
    if (priceRange.min > 0) params.price_min = priceRange.min;
    if (priceRange.max < 100000) params.price_max = priceRange.max;
    api.getProducts(params).then(d => {
      setProducts(prev => [...prev, ...d.products]);
      setTotal(d.total);
      setPage(nextPage);
    }).finally(() => setLoadingMore(false));
  };

  const handleDropToCart = async (productId) => {
    try {
      await api.addToCart(productId);
      setCartHighlight(true);
      setTimeout(() => setCartHighlight(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const sortOptions = [
    { value: 'popular', label: 'По популярности' },
    { value: 'cheapest', label: 'Дешевле' },
    { value: 'expensive', label: 'Дороже' },
    { value: 'newest', label: 'Новинки' },
  ];

  const currentCategory = categories.find(c => c.slug === category);
  const allTags = [...new Set(products.flatMap(p => p.tags || []))].slice(0, 10);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 hidden lg:block">
        <div className="sticky top-20 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Категории</h3>
            <Link to="/catalog" className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${!category ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <span className="text-base">🏪</span>
              <span>Все товары</span>
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} to={`/catalog/${cat.slug}`} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition font-medium ${category === cat.slug ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-4">
            <PriceFilter onChange={setPriceRange} />
          </div>

          {allTags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Теги</h3>
              <ProductTags tags={allTags} size="xs" />
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {search ? `Поиск: "${search}"` : currentCategory?.name || 'Все товары'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} товаров</p>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySwitcher />
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="h-10 px-4 glass-input rounded-xl text-sm text-white focus:outline-none appearance-none cursor-pointer">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">Товары не найдены</p>
            <Link to="/catalog" className="text-primary-400 text-sm mt-2 inline-block hover:text-primary-300">Показать все товары</Link>
          </div>
        ) : (
          <InfiniteScroll onLoadMore={loadMore} loading={loadingMore} hasMore={products.length < total}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((p, i) => (
                <div
                  key={p.id}
                  onMouseEnter={() => setQuickViewId(p.id)}
                  onMouseLeave={() => setQuickViewId(null)}
                >
                  <DragToCart product={p}>
                    <ProductCard product={p} index={i} />
                  </DragToCart>
                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>

      {/* Cart Drop Zone */}
      <CartDropZone onDrop={handleDropToCart}>
        <div className={`fixed bottom-6 right-24 z-40 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${cartHighlight ? 'bg-emerald-500/20 border border-emerald-500/30 scale-110' : 'glass border border-white/5'}`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          {cartHighlight && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>}
        </div>
      </CartDropZone>

      {quickViewId && (
        <QuickView
          productId={quickViewId}
          onClose={() => setQuickViewId(null)}
          onAuthClick={() => {}}
        />
      )}
    </div>
  );
}
