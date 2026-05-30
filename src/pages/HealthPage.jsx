import { useState, useEffect } from 'react';
import { useLanguage } from '../components/LanguageSwitcher';

export default function HealthPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setLatency(Date.now() - start);
      setStatus(data);
    } catch (err) {
      setLatency(Date.now() - start);
      setStatus({ status: 'error', error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const isOk = status?.status === 'ok' || status?.status === 'healthy';

  return (
    <div className="max-w-2xl mx-auto py-12 animate-fade-in">
      <div className="text-center mb-8">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-4xl shadow-xl transition-all duration-500 ${
          loading
            ? 'bg-yellow-500/10 border border-yellow-500/20 animate-pulse'
            : isOk
              ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/10'
              : 'bg-rose-500/10 border border-rose-500/20 shadow-rose-500/10'
        }`}>
          {loading ? '⏳' : isOk ? '✅' : '❌'}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">System Health</h1>
        <p className="text-gray-400 text-sm">{loading ? 'Проверка...' : isOk ? t('healthOk') : t('healthError')}</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        {/* Status indicator */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : isOk ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
            <span className="text-sm text-gray-300 font-medium">Статус сервера</span>
          </div>
          <span className={`text-sm font-semibold ${loading ? 'text-yellow-400' : isOk ? 'text-emerald-400' : 'text-rose-400'}`}>
            {loading ? 'Проверка...' : isOk ? 'OK' : 'ERROR'}
          </span>
        </div>

        {/* Latency */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-sm text-gray-300 font-medium">Задержка (latency)</span>
          <span className="text-sm text-gray-200 font-mono">
            {latency !== null ? `${latency}ms` : '—'}
          </span>
        </div>

        {/* Uptime */}
        {status?.uptime !== undefined && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-sm text-gray-300 font-medium">Аптайм</span>
            <span className="text-sm text-gray-200 font-mono">
              {Math.floor(status.uptime / 3600)}h {Math.floor((status.uptime % 3600) / 60)}m
            </span>
          </div>
        )}

        {/* Version */}
        {status?.version && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-sm text-gray-300 font-medium">Версия</span>
            <span className="text-sm text-gray-200 font-mono">{status.version}</span>
          </div>
        )}

        {/* Environment */}
        {status?.environment && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-sm text-gray-300 font-medium">Окружение</span>
            <span className="text-xs tag tag-primary">{status.environment}</span>
          </div>
        )}

        {/* Raw response */}
        {status && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Ответ сервера</p>
            <pre className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={checkHealth}
          disabled={loading}
          className="w-full glass-button px-5 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Проверка...' : 'Обновить'}
        </button>
      </div>
    </div>
  );
}
