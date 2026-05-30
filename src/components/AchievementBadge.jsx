export default function AchievementBadge({ achievement, size = 'md' }) {
  const { icon, name, description, unlocked = false, progress, maxProgress } = achievement;

  const sizes = {
    sm: { badge: 'w-10 h-10', icon: 'text-lg', text: 'text-[10px]' },
    md: { badge: 'w-14 h-14', icon: 'text-2xl', text: 'text-xs' },
    lg: { badge: 'w-20 h-20', icon: 'text-3xl', text: 'text-sm' },
  };

  const s = sizes[size] || sizes.md;
  const progressPercent = maxProgress ? Math.min((progress / maxProgress) * 100, 100) : null;

  return (
    <div className={`group relative inline-flex flex-col items-center gap-2 ${size === 'lg' ? 'p-3' : 'p-1.5'}`}>
      {/* Badge circle */}
      <div className="relative">
        <div
          className={`${s.badge} rounded-2xl flex items-center justify-center transition-all duration-300 ${
            unlocked
              ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/20 group-hover:scale-110'
              : 'bg-white/[0.03] border border-white/5 opacity-50 grayscale group-hover:opacity-70 group-hover:grayscale-0'
          }`}
        >
          <span className={s.icon}>{icon || '🏆'}</span>
        </div>

        {/* Glow effect on unlocked */}
        {unlocked && (
          <div className="absolute -inset-1 bg-amber-500/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Text content */}
      {size !== 'sm' && (
        <div className="text-center max-w-[120px]">
          <p className={`${s.text} font-semibold ${unlocked ? 'text-gray-200' : 'text-gray-500'} leading-tight`}>
            {name}
          </p>
          {description && size === 'lg' && (
            <p className="text-[10px] text-gray-600 mt-1 leading-snug">{description}</p>
          )}
        </div>
      )}

      {/* Progress bar */}
      {progressPercent !== null && (
        <div className="w-full mt-1">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                unlocked ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gray-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[9px] text-gray-600 text-center mt-1">
            {progress}/{maxProgress}
          </p>
        </div>
      )}

      {/* Locked overlay icon */}
      {!unlocked && size !== 'sm' && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function AchievementList({ achievements = [] }) {
  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <div className="glass-card rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🏆</span> Достижения
        </h2>
        <span className="text-xs text-gray-500">{unlocked.length}/{achievements.length}</span>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-gray-500 text-sm">Достижения скоро появятся</p>
        </div>
      ) : (
        <>
          {unlocked.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Получены</p>
              <div className="flex flex-wrap gap-1">
                {unlocked.map(a => (
                  <AchievementBadge key={a.id} achievement={a} size="md" />
                ))}
              </div>
            </div>
          )}
          {locked.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Ещё не получены</p>
              <div className="flex flex-wrap gap-1">
                {locked.map(a => (
                  <AchievementBadge key={a.id} achievement={a} size="md" />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
