import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showCached, setShowCached] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!online) {
      const timer = setTimeout(() => setShowCached(true), 2000);
      return () => clearTimeout(timer);
    }
    setShowCached(false);
  }, [online]);

  if (online) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-[80] animate-slide-down">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="backdrop-blur-xl bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl shadow-amber-500/10">
          <div className="relative">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.242 2.829a5 5 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">Вы офлайн</p>
            <p className="text-[11px] text-amber-400/60">Нет подключения к интернету</p>
          </div>
          {showCached && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="text-[11px] text-gray-500">Кэшированные данные</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
