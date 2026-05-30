import { useState, useRef } from 'react';

function getEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default function VideoPlayer({ url, className = '' }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef(null);

  if (!url) return null;

  const embedUrl = getEmbedUrl(url);
  const isMP4 = url.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-semibold text-white">Видео товара</span>
      </div>

      <div className="relative aspect-video bg-black/40">
        {playing ? (
          embedUrl && !error ? (
            <iframe
              src={`${embedUrl}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              onError={() => setError(true)}
            />
          ) : isMP4 ? (
            <video
              ref={videoRef}
              src={url}
              controls
              autoPlay
              className="w-full h-full object-contain"
              onError={() => setError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Видео недоступно</p>
            </div>
          )
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-black/50 to-indigo-900/30"></div>
            <div className="relative w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
              <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span className="text-xs text-gray-300 font-medium">Воспроизвести</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
