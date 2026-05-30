import { useState, useEffect } from 'react';

export default function PriceFilter({ onChange, min: minProp = 0, max: maxProp = 100000 }) {
  const [min, setMin] = useState(minProp);
  const [max, setMax] = useState(maxProp);
  const [dragging, setDragging] = useState(null);

  const range = maxProp - minProp || 1;
  const leftPercent = ((min - minProp) / range) * 100;
  const rightPercent = ((max - minProp) / range) * 100;

  const clamp = (val, lo, hi) => Math.min(hi, Math.max(lo, val));

  const handleMinChange = (e) => {
    const v = clamp(Number(e.target.value), minProp, max - 1);
    setMin(v);
  };

  const handleMaxChange = (e) => {
    const v = clamp(Number(e.target.value), min + 1, maxProp);
    setMax(v);
  };

  useEffect(() => {
    if (onChange) onChange({ min, max });
  }, [min, max]);

  const reset = () => { setMin(minProp); setMax(maxProp); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Цена</h3>
        {(min !== minProp || max !== maxProp) && (
          <button onClick={reset} className="text-[10px] text-primary-400 hover:text-primary-300 transition">Сброс</button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">₽</span>
          <input
            type="number"
            value={min}
            onChange={(e) => {
              const v = clamp(Number(e.target.value) || 0, minProp, max - 1);
              setMin(v);
            }}
            className="w-full h-9 pl-6 pr-2 glass-input rounded-xl text-xs text-white focus:outline-none"
            placeholder="От"
          />
        </div>
        <span className="text-gray-600 self-center text-xs">—</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">₽</span>
          <input
            type="number"
            value={max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value) || 0, min + 1, maxProp);
              setMax(v);
            }}
            className="w-full h-9 pl-6 pr-2 glass-input rounded-xl text-xs text-white focus:outline-none"
            placeholder="До"
          />
        </div>
      </div>

      <div className="relative h-8 px-1">
        <div className="absolute top-3 left-0 right-0 h-1.5 bg-white/[0.05] rounded-full">
          <div
            className="absolute h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full"
            style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
          />
        </div>
        <input
          type="range"
          min={minProp}
          max={maxProp}
          value={min}
          onChange={handleMinChange}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ pointerEvents: 'auto' }}
        />
        <input
          type="range"
          min={minProp}
          max={maxProp}
          value={max}
          onChange={handleMaxChange}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
          style={{ pointerEvents: 'auto' }}
        />
        <div
          className="absolute top-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 border-2 border-[#030712] shadow-lg shadow-primary-500/30 pointer-events-none"
          style={{ left: `calc(${leftPercent}% - 8px)` }}
        />
        <div
          className="absolute top-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-violet-400 to-accent-500 border-2 border-[#030712] shadow-lg shadow-violet-500/30 pointer-events-none"
          style={{ left: `calc(${rightPercent}% - 8px)` }}
        />
      </div>
    </div>
  );
}
