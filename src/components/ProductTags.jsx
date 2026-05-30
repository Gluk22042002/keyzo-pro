import { useNavigate } from 'react-router-dom';

export default function ProductTags({ tags = [], size = 'sm', onClick }) {
  const navigate = useNavigate();

  const handleClick = (tag) => {
    if (onClick) return onClick(tag);
    navigate(`/catalog?search=${encodeURIComponent(tag)}`);
  };

  if (!tags.length) return null;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <button
          key={i}
          onClick={() => handleClick(tag)}
          className={`inline-flex items-center gap-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-primary-400 hover:border-primary-500/30 hover:bg-primary-500/10 transition-all duration-200 font-medium cursor-pointer ${sizeClasses[size] || sizeClasses.sm}`}
        >
          <span className="text-[10px] opacity-50">#</span>
          {tag}
        </button>
      ))}
    </div>
  );
}
