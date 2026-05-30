import { useNavigate } from 'react-router-dom';
import ProductCompare, { useCompare } from '../components/ProductCompare';
import { useLanguage } from '../components/LanguageSwitcher';

export default function ComparePage() {
  const { compareList } = useCompare();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-white transition rounded-xl hover:bg-white/5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('comparePage')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {compareList.length > 0
              ? `Сравнивается ${compareList.length} из 4 товаров`
              : 'Добавьте товары для сравнения из каталога'
            }
          </p>
        </div>
      </div>

      {compareList.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center animate-scale-in">
          <div className="text-5xl mb-4">⚖️</div>
          <p className="text-gray-400 text-lg mb-2">Нет товаров для сравнения</p>
          <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
            Перейдите в каталог и нажмите кнопку «Сравнить» на карточках товаров, которые хотите сравнить
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="glass-button px-6 py-3 text-white font-semibold rounded-xl"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <ProductCompare />
      )}
    </div>
  );
}
