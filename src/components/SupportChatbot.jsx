import { useState, useRef, useEffect } from 'react';

const faq = [
  { q: ['оплата', 'платёж', 'заплатить', 'купить', 'оплатить'], a: 'Оплата производится через баланс Keyzo.pro. Пополните баланс в разделе "Пополнить" и используйте средства для покупок.' },
  { q: ['доставка', 'получить', 'когда', 'сколько ждать'], a: 'Автоматическая доставка — мгновенно после оплаты. Ручная — до 24 часов. Статус заказа можно отслеживать в разделе "Заказы".' },
  { q: ['возврат', 'вернуть', 'деньги', 'refund'], a: 'Возврат возможен в течение 24 часов после покупки, если товар не был активирован. Откройте спор в разделе заказов.' },
  { q: ['продавец', 'товар', 'добавить', 'продавать'], a: 'Чтобы стать продавцом, перейдите в "Панель продавца" и заполните профиль. Комиссия — от 5% до 15%.' },
  { q: ['баланс', 'пополнить', 'деньги', 'депозит'], a: 'Баланс пополняется через раздел "Пополнить" в шапке сайта. Поддерживаются карты, криптовалюта и другие способы.' },
  { q: ['аккаунт', 'войти', 'пароль', 'регистрация'], a: 'Регистрация через email. Если забыли пароль — восстановите через форму входа. Двухфакторная аутентификация доступна в настройках.' },
  { q: ['скидки', 'промокод', 'купон', 'акция'], a: 'Промокоды применяются при оформлении заказа. Акции и скидки отображаются на главной странице и в каталоге.' },
  { q: ['безопасность', 'безопасно', 'надёжно', 'гарантия'], a: 'Все сделки защищены эскроу-системой. Средства замораживаются до подтверждения получения товара покупателем.' },
  { q: ['поддержка', 'помощь', 'написать', 'связаться'], a: 'Вы можете написать нам в Telegram (@keyzo_support) или Discord. Также доступна эта чат-бот поддержка 24/7.' },
  { q: ['комиссия', 'процент', 'сколько берёте'], a: 'Комиссия для продавцов составляет от 5% до 15% в зависимости от категории товара и подписки продавца.' },
];

const quickReplies = [
  'Как оплатить заказ?',
  'Как стать продавцом?',
  'Как вернуть деньги?',
  'Как пополнить баланс?',
  'Безопасны ли сделки?',
];

function getResponse(input) {
  const lower = input.toLowerCase();
  for (const item of faq) {
    if (item.q.some(kw => lower.includes(kw))) return item.a;
  }
  return 'Спасибо за вопрос! Попробуйте перефразировать или выберите тему из быстрых ответов. Для связи с поддержкой: @keyzo_support в Telegram.';
}

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Привет! Я виртуальный помощник Keyzo.pro. Чем могу помочь?' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: getResponse(text) }]);
      setTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${open ? 'bg-rose-500/20 border border-rose-500/30 rotate-0' : 'glass-button shadow-primary-500/30 hover:shadow-primary-500/50'}`}
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#030712]"></span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] animate-slide-up">
          <div className="glass rounded-3xl shadow-2xl shadow-black/40 border border-white/5 overflow-hidden flex flex-col" style={{ height: '500px' }}>
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Поддержка Keyzo</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="text-xs text-gray-400">Онлайн</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.from === 'user'
                      ? 'bg-gradient-to-br from-indigo-500/80 to-violet-500/80 text-white rounded-br-md'
                      : 'bg-white/[0.05] text-gray-300 border border-white/5 rounded-bl-md'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/5 rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => send(qr)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/5 text-xs text-gray-400 hover:text-white hover:border-indigo-500/30 transition"
                  >
                    {qr}
                  </button>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="flex-1 h-10 px-4 glass-input rounded-xl text-sm text-white placeholder-gray-600"
                />
                <button type="submit" disabled={!input.trim()} className="w-10 h-10 glass-button rounded-xl flex items-center justify-center disabled:opacity-30">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
