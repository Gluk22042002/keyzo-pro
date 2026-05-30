import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

function MessageBubble({ msg, isOwn, showAvatar, otherUser }) {
  const time = new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-primary-400 text-xs font-bold mr-2 shrink-0 mt-auto">
          {otherUser?.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 shrink-0" />}
      <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
        <div className={`px-4 py-2.5 text-sm leading-relaxed ${
          isOwn 
            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl rounded-br-md shadow-lg shadow-primary-500/20' 
            : 'bg-dark-700/80 text-gray-200 rounded-2xl rounded-bl-md border border-white/5'
        }`}>
          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        </div>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-right text-gray-600' : 'text-gray-600'}`}>{time}</p>
      </div>
    </div>
  );
}

function DateSeparator({ date }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  let label = d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
  if (d.toDateString() === today.toDateString()) label = 'Сегодня';
  else if (d.toDateString() === yesterday.toDateString()) label = 'Вчера';
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-xs text-gray-600 font-medium">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [thread, setThread] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);
  const refreshRef = useRef(null);

  const loadConversations = useCallback(() => {
    if (user) api.getMessages().then(setConversations).catch(() => {});
  }, [user]);

  const loadThread = useCallback(() => {
    if (userId && user) {
      api.getThread(userId).then(d => { setThread(d.messages); setOtherUser(d.user); }).catch(() => {});
    }
  }, [userId, user]);

  useEffect(() => { loadConversations(); setLoading(false); }, [loadConversations]);
  useEffect(() => { loadThread(); }, [loadThread]);

  useEffect(() => {
    if (userId) {
      refreshRef.current = setInterval(loadThread, 5000);
      return () => clearInterval(refreshRef.current);
    }
  }, [userId, loadThread]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    try {
      const msg = await api.sendMessage(userId, msgText);
      setThread(prev => [...prev, { ...msg, sender_id: user.id }]);
      loadConversations();
    } catch (err) { setText(msgText); } finally { setSending(false); }
  };

  if (!user) return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl">💬</div>
      <p className="text-gray-400 text-lg mb-4">Войдите, чтобы увидеть сообщения</p>
      <Link to="/" className="glass-button px-6 py-3 text-white font-semibold rounded-xl inline-block">На главную</Link>
    </div>
  );

  if (userId) {
    const groupedMessages = [];
    let lastDate = '';
    thread.forEach(m => {
      const d = new Date(m.created_at).toDateString();
      if (d !== lastDate) { groupedMessages.push({ type: 'date', date: m.created_at }); lastDate = d; }
      groupedMessages.push({ type: 'message', ...m });
    });

    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <Link to="/messages" className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              {otherUser?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-900" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-semibold">{otherUser?.username || 'User'}</p>
            <p className="text-xs text-emerald-400">В сети</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
          {thread.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center text-3xl">👋</div>
              <p className="text-gray-400 font-medium">Начните переписку</p>
              <p className="text-xs text-gray-600 mt-1">Напишите первое сообщение</p>
            </div>
          )}
          {groupedMessages.map((item, i) => {
            if (item.type === 'date') return <DateSeparator key={`d-${i}`} date={item.date} />;
            const isOwn = item.sender_id === user.id;
            const prev = groupedMessages[i - 1];
            const showAvatar = !isOwn && (prev?.type === 'date' || prev?.sender_id === user.id);
            return <MessageBubble key={item.id} msg={item} isOwn={isOwn} showAvatar={showAvatar} otherUser={otherUser} />;
          })}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="pt-3 border-t border-white/5">
          <div className="flex gap-2 items-end">
            <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)}
              placeholder="Сообщение..." className="flex-1 h-11 px-4 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:border-primary-500 focus:outline-none transition" />
            <button type="submit" disabled={sending || !text.trim()}
              className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${text.trim() ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-dark-800 text-gray-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-5">Сообщения</h1>
      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 glass-card rounded-2xl animate-shimmer" />)}</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center text-3xl">💬</div>
          <p className="text-gray-400 font-medium">Нет сообщений</p>
          <p className="text-xs text-gray-600 mt-1">Напишите продавцу со страницы товара</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <Link key={c.user_id} to={`/messages/${c.user_id}`} className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-primary-500/20 transition">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0">{c.username?.[0]?.toUpperCase()}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-800" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-semibold">{c.username}</span>
                  {c.unread > 0 && <span className="px-1.5 py-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full">{c.unread}</span>}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{c.last_message}</p>
              </div>
              <span className="text-[10px] text-gray-600 shrink-0">{new Date(c.last_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
