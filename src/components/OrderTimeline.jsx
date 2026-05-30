const steps = [
  { key: 'paid', label: 'Оплачен', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  )},
  { key: 'processing', label: 'В обработке', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
  )},
  { key: 'delivered', label: 'Доставлен', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  )},
  { key: 'completed', label: 'Завершён', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
];

function getStepIndex(status) {
  const map = { paid: 0, processing: 1, delivered: 2, completed: 3, pending: 0, cancelled: -1 };
  return map[status] ?? 0;
}

export default function OrderTimeline({ status = 'pending', timestamps = {} }) {
  const activeIndex = getStepIndex(status);
  const isCancelled = status === 'cancelled';

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const isActive = i <= activeIndex && !isCancelled;
        const isCurrent = i === activeIndex && !isCancelled;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                isActive
                  ? 'bg-gradient-to-br from-primary-500 to-violet-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white/[0.05] text-gray-600 border border-white/[0.08]'
              } ${isCurrent ? 'ring-2 ring-primary-500/30 scale-110' : ''}`}>
                {isActive ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                ) : step.icon}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-primary-400' : 'text-gray-600'}`}>
                {step.label}
              </span>
              {timestamps[step.key] && (
                <span className="text-[9px] text-gray-700 whitespace-nowrap">
                  {new Date(timestamps[step.key]).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                i < activeIndex && !isCancelled ? 'bg-gradient-to-r from-primary-500 to-violet-500' : 'bg-white/[0.05]'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
