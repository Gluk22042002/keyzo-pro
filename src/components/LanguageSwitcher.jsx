import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const translations = {
  ru: {
    catalog: 'Каталог',
    search: 'Поиск игр, ключей, подписок...',
    login: 'Войти',
    logout: 'Выйти',
    register: 'Зарегистрироваться',
    cart: 'Корзина',
    orders: 'Заказы',
    favorites: 'Избранное',
    messages: 'Сообщения',
    seller: 'Продавец',
    admin: 'Админ',
    price: 'Цена',
    rating: 'Рейтинг',
    reviews: 'Отзывов',
    sales: 'Продаж',
    inStock: 'В наличии',
    outOfStock: 'Нет в наличии',
    addToCart: 'В корзину',
    buyNow: 'Купить',
    compare: 'Сравнить',
    recentlyViewed: 'Недавно просмотренные',
    askQuestion: 'Задать вопрос',
    answer: 'Ответить',
    questions: 'Вопросы и ответы',
    noQuestions: 'Вопросов пока нет. Будьте первым!',
    free: 'Бесплатно',
    pro: 'Про',
    business: 'Бизнес',
    perMonth: '/мес',
    features: 'Возможности',
    subscribe: 'Подписаться',
    export: 'Экспорт',
    import: 'Импорт',
    csv: 'CSV',
    json: 'JSON',
    dragDrop: 'Перетащите CSV файл сюда',
    preview: 'Предпросмотр',
    confirmImport: 'Подтвердить импорт',
    healthOk: 'Сервер работает',
    healthError: 'Ошибка сервера',
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    submit: 'Отправить',
    back: 'Назад',
    all: 'Все',
    achievements: 'Достижения',
    comparePage: 'Сравнение товаров',
    noItems: 'Нет элементов',
    days: 'Дн',
    hours: 'Час',
    minutes: 'Мин',
    seconds: 'Сек',
    expiresSoon: 'Скоро истекает',
  },
  en: {
    catalog: 'Catalog',
    search: 'Search games, keys, subscriptions...',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    cart: 'Cart',
    orders: 'Orders',
    favorites: 'Favorites',
    messages: 'Messages',
    seller: 'Seller',
    admin: 'Admin',
    price: 'Price',
    rating: 'Rating',
    reviews: 'Reviews',
    sales: 'Sales',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    addToCart: 'Add to cart',
    buyNow: 'Buy now',
    compare: 'Compare',
    recentlyViewed: 'Recently viewed',
    askQuestion: 'Ask a question',
    answer: 'Answer',
    questions: 'Questions & Answers',
    noQuestions: 'No questions yet. Be the first!',
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    perMonth: '/mo',
    features: 'Features',
    subscribe: 'Subscribe',
    export: 'Export',
    import: 'Import',
    csv: 'CSV',
    json: 'JSON',
    dragDrop: 'Drop CSV file here',
    preview: 'Preview',
    confirmImport: 'Confirm import',
    healthOk: 'Server is running',
    healthError: 'Server error',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    submit: 'Submit',
    back: 'Back',
    all: 'All',
    achievements: 'Achievements',
    comparePage: 'Compare Products',
    noItems: 'No items',
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    expiresSoon: 'Expires soon',
  },
};

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'ru' ? 'en' : 'ru';
      localStorage.setItem('lang', next);
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.ru[key] || key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLanguage = () => useContext(LangContext);

export default function LanguageSwitcher() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      className="relative px-3 py-2 rounded-xl glass-button text-white/80 hover:text-white transition-all text-sm font-semibold tracking-wide group"
      title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <span className="text-base">{lang === 'ru' ? '🇷🇺' : '🇬🇧'}</span>
        <span className="hidden sm:inline uppercase text-xs">{lang}</span>
      </span>
    </button>
  );
}
