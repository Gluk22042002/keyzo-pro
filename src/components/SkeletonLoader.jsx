export function SkeletonProductCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-44 bg-white/[0.03] animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/[0.05] rounded-lg w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-white/[0.05] rounded-lg w-12" />
          <div className="h-3 bg-white/[0.05] rounded-lg w-16" />
          <div className="h-3 bg-white/[0.05] rounded-lg w-10" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-5 bg-white/[0.05] rounded-lg w-1/3" />
          <div className="h-5 bg-white/[0.05] rounded-lg w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="h-3 bg-white/[0.05] rounded w-16" />
        <div className="h-3 bg-white/[0.05] rounded w-3" />
        <div className="h-3 bg-white/[0.05] rounded w-16" />
        <div className="h-3 bg-white/[0.05] rounded w-3" />
        <div className="h-3 bg-white/[0.05] rounded w-32" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-80 glass-card rounded-2xl animate-shimmer" />
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="h-5 bg-white/[0.05] rounded w-32" />
            <div className="h-4 bg-white/[0.05] rounded w-full" />
            <div className="h-4 bg-white/[0.05] rounded w-5/6" />
            <div className="h-4 bg-white/[0.05] rounded w-2/3" />
            <div className="flex gap-2 mt-3">
              <div className="h-6 bg-white/[0.05] rounded-lg w-24" />
              <div className="h-6 bg-white/[0.05] rounded-lg w-20" />
              <div className="h-6 bg-white/[0.05] rounded-lg w-28" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="h-6 bg-white/[0.05] rounded w-3/4" />
            <div className="flex gap-2">
              <div className="h-4 bg-white/[0.05] rounded w-20" />
              <div className="h-4 bg-white/[0.05] rounded w-16" />
            </div>
            <div className="h-8 bg-white/[0.05] rounded w-1/2" />
            <div className="h-12 bg-white/[0.05] rounded-xl w-full" />
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-3 bg-white/[0.05] rounded w-3/4" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonOrderItem() {
  return (
    <div className="glass-card rounded-2xl p-5 animate-shimmer">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/[0.03] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/[0.05] rounded w-3/4" />
          <div className="h-3 bg-white/[0.05] rounded w-1/2" />
        </div>
        <div className="text-right space-y-2 shrink-0">
          <div className="h-4 bg-white/[0.05] rounded w-20 ml-auto" />
          <div className="h-3 bg-white/[0.05] rounded w-16 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const Component = {
    card: SkeletonProductCard,
    page: SkeletonProductPage,
    order: SkeletonOrderItem,
  }[type] || SkeletonProductCard;

  if (type === 'page') return <Component />;

  return (
    <div className="space-y-3">
      {Array(count).fill(0).map((_, i) => <Component key={i} />)}
    </div>
  );
}
