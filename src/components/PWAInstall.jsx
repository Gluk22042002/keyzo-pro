import { useState, useEffect } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
      <div className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.1] rounded-2xl p-4 shadow-2xl shadow-black/40 max-w-[260px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Keyzo.pro</p>
            <p className="text-[11px] text-gray-500">Установить приложение</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">Быстрый доступ, офлайн режим, уведомления о заказах.</p>
        <div className="flex gap-2">
          <button onClick={install} className="flex-1 h-9 glass-button text-white text-xs font-semibold rounded-xl">Установить</button>
          <button onClick={() => setShow(false)} className="h-9 px-3 text-xs text-gray-500 hover:text-white transition rounded-xl hover:bg-white/5">Позже</button>
        </div>
      </div>
    </div>
  );
}
