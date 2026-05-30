import { useState, useRef } from 'react';
import { api } from '../utils/api';

export default function DragToCart({ children, product }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragImageRef = useRef(null);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ productId: product.id, title: product.title }));
    e.dataTransfer.effectAllowed = 'copy';

    const ghost = document.createElement('div');
    ghost.className = 'fixed pointer-events-none z-[9999] px-3 py-2 rounded-xl bg-indigo-500/90 backdrop-blur text-white text-xs font-bold shadow-lg shadow-indigo-500/30';
    ghost.textContent = product.title?.slice(0, 20) || 'Товар';
    ghost.style.left = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    dragImageRef.current = ghost;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragImageRef.current) {
      dragImageRef.current.remove();
      dragImageRef.current = null;
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/5 pointer-events-none flex items-center justify-center z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/90 text-white text-xs font-bold">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Перетащите в корзину
          </div>
        </div>
      )}
    </div>
  );
}

export function CartDropZone({ onDrop, children }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.productId) onDrop?.(data.productId);
    } catch {}
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all duration-200 ${dragOver ? 'scale-110' : ''}`}
    >
      {children}
      {dragOver && (
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center z-50 animate-pulse">
          <span className="text-xs font-bold text-emerald-400">Отпустите!</span>
        </div>
      )}
    </div>
  );
}
