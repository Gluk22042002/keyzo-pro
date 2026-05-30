import { useEffect, useState } from 'react';

export default function AnimatedPage({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className={`transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      {children}
    </div>
  );
}
