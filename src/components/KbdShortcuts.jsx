import { useEffect, useState } from 'react';

const shortcuts = [
  { key: 'Ctrl+K', label: 'Поиск', description: 'Фокус на строке поиска' },
  { key: 'Esc', label: 'Закрыть', description: 'Закрыть модальные окна' },
  { key: '/', label: 'Поиск', description: 'Быстрый поиск' },
];

export default function KbdShortcuts({ searchInputRef }) {
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('closeAllModals'));
        const activeEl = document.activeElement;
        if (activeEl && activeEl !== document.body) activeEl.blur();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef?.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          if (searchInputRef?.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowHints(prev => !prev);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchInputRef]);

  return (
    <>
      {showHints && (
        <div className="fixed bottom-6 left-6 z-50 glass rounded-2xl p-5 shadow-2xl shadow-black/40 border border-white/5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Горячие клавиши</h3>
            <button onClick={() => setShowHints(false)} className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <kbd className="px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-mono text-gray-300 min-w-[60px] text-center">
                  {s.key}
                </kbd>
                <span className="text-xs text-gray-400">{s.description}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3">Нажмите <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 font-mono text-gray-500">Ctrl+/</kbd> чтобы показать/скрыть</p>
        </div>
      )}
    </>
  );
}

export function ShortcutHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    const hideTimer = setTimeout(() => setVisible(false), 8000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 glass rounded-xl px-4 py-2.5 shadow-lg shadow-black/20 border border-white/5 animate-slide-up flex items-center gap-2">
      <span className="text-xs text-gray-400">Горячие клавиши:</span>
      <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-gray-300">Ctrl+/</kbd>
      <button onClick={() => setVisible(false)} className="ml-1 p-0.5 text-gray-600 hover:text-white">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
