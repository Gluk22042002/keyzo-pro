import { useCurrency } from './CurrencySwitcher';

export default function ProductBundle({ product, onAddBundle }) {
  const { convert } = useCurrency();
  const bundleRules = [
    { count: 2, discount: 10 },
    { count: 3, discount: 15 },
    { count: 5, discount: 25 },
  ];

  const applicable = bundleRules.find(r => (product?.sold_count || 0) >= r.count) || bundleRules[0];
  const bundlePrice = product ? Math.round(product.price * (1 - applicable.discount / 100)) : 0;

  return (
    <div className="glass-card rounded-2xl p-5 border border-cyan-500/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-white">Бандлы — скидка за объём</h3>
      </div>

      <div className="space-y-2">
        {bundleRules.map(rule => {
          const price = product ? Math.round(product.price * (1 - rule.discount / 100) * rule.count) : 0;
          const savings = product ? Math.round(product.price * rule.count - price) : 0;
          return (
            <div
              key={rule.count}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="text-lg font-black text-cyan-400">×{rule.count}</div>
                <div>
                  <span className="text-sm text-white font-medium">Купи {rule.count} — </span>
                  <span className="text-sm text-cyan-400 font-bold">-{rule.discount}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{convert(price)}</div>
                <div className="text-xs text-emerald-400">-{convert(savings)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onAddBundle?.(applicable)}
        className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 text-sm font-semibold text-cyan-400 hover:from-cyan-500/30 hover:to-indigo-500/30 transition"
      >
        Купить бандл ×{applicable.count}
      </button>
    </div>
  );
}

export function BundleBadge({ product }) {
  const bestRule = [
    { count: 5, discount: 25 },
    { count: 3, discount: 15 },
    { count: 2, discount: 10 },
  ].find(() => true);

  if (!product) return null;

  return (
    <div className="absolute top-3 right-12 px-2 py-0.5 rounded-lg bg-cyan-500/90 text-white text-xs font-bold backdrop-blur-sm">
      Бандл -10%
    </div>
  );
}
