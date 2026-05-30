import { useState, useMemo } from 'react';

function BarChart({ data, label, color = '#6366f1' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const width = 100;
  const height = 60;
  const barWidth = Math.max(100 / data.length - 2, 2);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="relative h-16">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i} x1="0" y1={height - t * height} x2={width} y2={height - t * height} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}
          {data.map((d, i) => {
            const barH = (d.value / max) * (height - 4);
            const x = i * (width / data.length) + 1;
            return (
              <rect
                key={i}
                x={x}
                y={height - barH}
                width={barWidth}
                height={barH}
                rx="1"
                fill={color}
                opacity="0.7"
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function LineChart({ data, label, color = '#22d3ee' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const width = 100;
  const height = 60;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - (d.value / max) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="relative h-16">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i} x1="0" y1={height - t * height} x2={width} y2={height - t * height} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}
          <polygon points={areaPoints} fill={`${color}15`} />
          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * width;
            const y = height - (d.value / max) * (height - 8) - 4;
            return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
          })}
        </svg>
      </div>
    </div>
  );
}

export default function SellerAnalyticsChart({ analytics }) {
  const [period, setPeriod] = useState('30d');

  const chartData = useMemo(() => {
    if (!analytics?.daily) {
      return {
        revenue: Array.from({ length: 7 }, (_, i) => ({
          label: `День ${i + 1}`,
          value: Math.floor(Math.random() * 5000) + 1000,
        })),
        orders: Array.from({ length: 7 }, (_, i) => ({
          label: `День ${i + 1}`,
          value: Math.floor(Math.random() * 30) + 5,
        })),
        views: Array.from({ length: 7 }, (_, i) => ({
          label: `День ${i + 1}`,
          value: Math.floor(Math.random() * 500) + 100,
        })),
      };
    }

    const daily = analytics.daily.slice(period === '7d' ? -7 : period === '30d' ? -30 : -90);
    return {
      revenue: daily.map(d => ({ label: d.date, value: d.revenue || 0 })),
      orders: daily.map(d => ({ label: d.date, value: d.orders || 0 })),
      views: daily.map(d => ({ label: d.date, value: d.views || 0 })),
    };
  }, [analytics, period]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">Аналитика</h3>
        <div className="flex gap-1 p-0.5 glass rounded-lg">
          {[
            { id: '7d', label: '7 дн' },
            { id: '30d', label: '30 дн' },
            { id: '90d', label: '90 дн' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${period === p.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-white'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="glass-card rounded-2xl p-4">
          <BarChart data={chartData.revenue} label="Доход (₽)" color="#6366f1" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">{chartData.revenue[0]?.label}</span>
            <span className="text-xs text-gray-600">{chartData.revenue[chartData.revenue.length - 1]?.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4">
            <LineChart data={chartData.orders} label="Заказы" color="#22d3ee" />
          </div>
          <div className="glass-card rounded-2xl p-4">
            <LineChart data={chartData.views} label="Просмотры" color="#a78bfa" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Доход', value: chartData.revenue.reduce((s, d) => s + d.value, 0), color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Заказы', value: chartData.orders.reduce((s, d) => s + d.value, 0), color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Просмотры', value: chartData.views.reduce((s, d) => s + d.value, 0), color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map((s, i) => (
            <div key={i} className={`p-3 rounded-xl ${s.bg}`}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
