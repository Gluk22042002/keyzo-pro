import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const posts = [
  {
    id: 1,
    slug: 'kak-kupit-igru-na-keyzo',
    title: 'Как купить игру на Keyzo.pro за 2 минуты',
    excerpt: 'Пошаговая инструкция для новичков: от регистрации до получения ключа.',
    category: 'Гайды',
    date: '2026-05-28',
    readTime: '3 мин',
    emoji: '🎮',
  },
  {
    id: 2,
    slug: 'prodavay-cifrovyi-tovary',
    title: 'Как начать продавать цифровые товары',
    excerpt: 'Рассказываем, как стать продавцом и зарабатывать на маркетплейсе.',
    category: 'Продавцам',
    date: '2026-05-25',
    readTime: '5 мин',
    emoji: '💰',
  },
  {
    id: 3,
    slug: 'bezopasnost-sdelok',
    title: 'Безопасность сделок: как работает эскроу',
    excerpt: 'Разбираемся, почему ваши деньги в безопасности на Keyzo.pro.',
    category: 'Безопасность',
    date: '2026-05-22',
    readTime: '4 мин',
    emoji: '🔒',
  },
  {
    id: 4,
    slug: 'top-5-skidok-mesyaca',
    title: 'Топ-5 скидок месяца: май 2026',
    excerpt: 'Лучшие предложения, которые не стоит пропускать в этом месяце.',
    category: 'Подборки',
    date: '2026-05-20',
    readTime: '2 мин',
    emoji: '🔥',
  },
  {
    id: 5,
    slug: 'promokody-i-bonusy',
    title: 'Где искать промокоды и бонусы',
    excerpt: 'Все способы получить дополнительную скидку на покупки.',
    category: 'Советы',
    date: '2026-05-18',
    readTime: '3 мин',
    emoji: '🎁',
  },
  {
    id: 6,
    slug: 'populyarnye-igry-2026',
    title: 'Самые популярные игры 2026 года',
    excerpt: 'Обзор самых продаваемых игр на маркетплейсе в этом году.',
    category: 'Обзоры',
    date: '2026-05-15',
    readTime: '6 мин',
    emoji: '🏆',
  },
];

function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="glass-card rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
      <div className="h-44 bg-gradient-to-br from-primary-900/30 via-violet-900/20 to-accent-900/30 flex items-center justify-center relative">
        <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{post.emoji}</span>
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/[0.08] backdrop-blur-sm border border-white/10 text-xs text-gray-300 font-medium">
          {post.category}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</span>
          <span className="text-gray-700">·</span>
          <span className="text-xs text-gray-500">{post.readTime} чтения</span>
        </div>
        <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-400 transition line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{post.excerpt}</p>
      </div>
    </Link>
  );
}

function PostPage({ slug }) {
  const post = posts.find(p => p.slug === slug);
  if (!post) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📄</div>
      <p className="text-gray-400 text-lg">Статья не найдена</p>
      <Link to="/blog" className="text-indigo-400 text-sm mt-2 inline-block hover:text-indigo-300">← Назад к блогу</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад к блогу
      </Link>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-56 bg-gradient-to-br from-primary-900/30 via-violet-900/20 to-accent-900/30 flex items-center justify-center">
          <span className="text-7xl">{post.emoji}</span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-medium border border-indigo-500/20">{post.category}</span>
            <span className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-500">{post.readTime} чтения</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-4">{post.title}</h1>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-gray-400 leading-relaxed text-base">{post.excerpt}</p>
            <p className="text-gray-400 leading-relaxed mt-4">
              Это демонстрационная статья блога Keyzo.pro. В реальном проекте здесь будет полный текст статьи с
              подробными инструкциями, скриншотами и полезными советами для пользователей маркетплейса.
            </p>
            <p className="text-gray-400 leading-relaxed mt-4">
              Мы регулярно публикуем гайды, обзоры и новости, чтобы вы могли максимально эффективно использовать
              все возможности Keyzo.pro для покупок и продаж цифровых товаров.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-indigo-400 text-sm font-bold">K</div>
            <div>
              <p className="text-sm text-white font-medium">Keyzo.pro Team</p>
              <p className="text-xs text-gray-500">Команда маркетплейса</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogPreview() {
  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Блог</h2>
          <p className="text-sm text-gray-500 mt-0.5">Гайды, новости и советы</p>
        </div>
        <Link to="/blog" className="text-sm text-indigo-400 hover:text-indigo-300 transition font-medium">Все статьи →</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.slice(0, 3).map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </section>
  );
}

export default function BlogPage() {
  const { slug } = useParams();

  if (slug) return <PostPage slug={slug} />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Блог Keyzo.pro</h1>
        <p className="text-gray-400">Гайды, обзоры и новости маркетплейса</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
