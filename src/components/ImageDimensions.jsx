import { useState, useEffect } from 'react';

export default function ImageDimensions({ src, className = '' }) {
  const [dims, setDims] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    setError(false);
    setDims(null);
    const img = new Image();
    img.onload = () => {
      setDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  if (error || !dims) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-gray-500 ${className}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {dims.width}×{dims.height} px
    </span>
  );
}
