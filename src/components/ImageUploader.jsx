import { useState, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { useToast } from './Toast';

export default function ImageUploader({ value, onChange, className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const inputRef = useRef(null);
  const toast = useToast();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      onChange(data.url);
      toast.success('Изображение загружено');
    } catch (err) {
      toast.error(err.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [onChange, toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      {preview ? (
        <div className="relative group rounded-2xl overflow-hidden border border-white/5">
          <img src={preview} className="w-full h-40 object-cover" alt="Превью" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Заменить"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition"
              title="Удалить"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 py-10 ${
            dragOver
              ? 'border-primary-400 bg-primary-500/10'
              : 'border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
          }`}
        >
          {uploading ? (
            <svg className="w-10 h-10 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Перетащите изображение сюда</p>
                <p className="text-xs text-gray-600 mt-1">или нажмите для выбора файла</p>
              </div>
              <span className="text-xs text-gray-600">PNG, JPG, WebP — до 5 МБ</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
