import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const audioRef = useRef(null);

  const addToast = useCallback((message, type = 'info', duration = 4000, sound = false) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, removing: false }]);

    if (sound && audioRef.current) {
      try { audioRef.current.play().catch(() => {}); } catch {}
    }

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400);
    }, duration);
  }, []);

  const toast = {
    success: (msg, dur, sound) => addToast(msg, 'success', dur, sound),
    error: (msg, dur, sound) => addToast(msg, 'error', dur, sound),
    info: (msg, dur, sound) => addToast(msg, 'info', dur, sound),
  };

  return (
    <ToastContext.Provider value={toast}>
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRl9vT19teleQBAABAAIAAA==" type="audio/wav" />
      </audio>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none max-h-[calc(100vh-6rem)] overflow-hidden">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }) {
  const { message, type, removing } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const duration = 4000;
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      if (elapsed < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const styles = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: (
        <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      glow: 'shadow-emerald-500/20',
      bar: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/30',
      icon: (
        <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      glow: 'shadow-rose-500/20',
      bar: 'bg-rose-500',
    },
    info: {
      bg: 'bg-primary-500/10 border-primary-500/30',
      icon: (
        <svg className="w-5 h-5 text-primary-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      glow: 'shadow-primary-500/20',
      bar: 'bg-primary-500',
    },
  };

  const s = styles[type];

  return (
    <div
      className={`pointer-events-auto max-w-sm w-full backdrop-blur-xl rounded-2xl border ${s.bg} shadow-2xl ${s.glow} transition-all duration-500 overflow-hidden ${
        removing ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {s.icon}
        <p className="text-sm text-gray-200 flex-1">{message}</p>
      </div>
      <div className="h-0.5 bg-white/[0.03]">
        <div
          className={`h-full ${s.bar} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
