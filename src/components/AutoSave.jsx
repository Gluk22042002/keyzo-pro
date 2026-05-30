import { useState, useEffect, useCallback } from 'react';

export default function AutoSave({ formKey, children, onRestore }) {
  const [showRestored, setShowRestored] = useState(false);

  const restoreDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(`draft_${formKey}`);
      if (saved) {
        const data = JSON.parse(saved);
        setShowRestored(true);
        setTimeout(() => setShowRestored(false), 3000);
        return data;
      }
    } catch {}
    return null;
  }, [formKey]);

  const saveDraft = useCallback((data) => {
    try {
      localStorage.setItem(`draft_${formKey}`, JSON.stringify({ ...data, _savedAt: Date.now() }));
    } catch {}
  }, [formKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`draft_${formKey}`);
  }, [formKey]);

  useEffect(() => {
    onRestore?.(restoreDraft());
  }, []);

  return (
    <div className="relative">
      {children}
      {showRestored && (
        <div className="fixed bottom-6 right-6 z-50 glass rounded-xl px-4 py-3 shadow-lg shadow-black/20 border border-white/5 animate-slide-up flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-white font-medium">Черновик восстановлен</p>
            <p className="text-xs text-gray-500">Ваши данные были сохранены ранее</p>
          </div>
          <button onClick={() => setShowRestored(false)} className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export function useAutoSave(formKey, formData, delay = 2000) {
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!formData || Object.keys(formData).length === 0) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`draft_${formKey}`, JSON.stringify({ ...formData, _savedAt: Date.now() }));
        setLastSaved(Date.now());
      } catch {}
    }, delay);
    return () => clearTimeout(timer);
  }, [formData, formKey, delay]);

  const restore = useCallback(() => {
    try {
      const saved = localStorage.getItem(`draft_${formKey}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, [formKey]);

  const clear = useCallback(() => {
    localStorage.removeItem(`draft_${formKey}`);
  }, [formKey]);

  return { restore, clear, lastSaved };
}
