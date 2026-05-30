import { useState, useRef, useEffect } from 'react';

export default function BlurImage({ src, alt, className = '', ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const canvasRef = useRef(null);
  const [blurDataUrl, setBlurDataUrl] = useState(null);

  useEffect(() => {
    if (!src || loaded) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 20;
      canvas.width = size;
      canvas.height = (img.height / img.width) * size || size * 0.75;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setBlurDataUrl(canvas.toDataURL('image/jpeg', 0.3));
      setLoaded(true);
    };
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  if (error || !src) {
    return (
      <div className={`bg-gradient-to-br from-primary-900/30 to-violet-900/30 flex items-center justify-center ${className}`}>
        <span className="text-3xl opacity-30">🎮</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {blurDataUrl && !loaded && (
        <img
          src={blurDataUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
          style={{ imageRendering: 'auto' }}
        />
      )}
      <img
        src={src}
        alt={alt || ''}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onError={() => setError(true)}
        {...props}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
