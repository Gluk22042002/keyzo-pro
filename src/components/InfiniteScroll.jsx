import { useEffect, useRef, useCallback } from 'react';

export default function InfiniteScroll({ onLoadMore, loading, hasMore, children }) {
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const handleIntersect = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loading]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleIntersect, { threshold: 0.1, rootMargin: '200px' });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleIntersect]);

  return (
    <div>
      {children}
      <div ref={sentinelRef} className="py-6">
        {loading && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Загрузка...</span>
            </div>
          </div>
        )}
        {!hasMore && !loading && (
          <p className="text-center text-xs text-gray-700">Больше нет товаров</p>
        )}
      </div>
    </div>
  );
}
