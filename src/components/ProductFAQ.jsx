import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from './LanguageSwitcher';
import { useToast } from './Toast';

export default function ProductFAQ({ productId }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [productId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await api.request(`/questions/${productId}`);
      setQuestions(data.questions || []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    try {
      await api.request(`/questions/${productId}`, {
        method: 'POST',
        body: JSON.stringify({ text: newQuestion.trim() }),
      });
      setNewQuestion('');
      toast.success('Вопрос отправлен');
      loadQuestions();
    } catch (err) {
      toast.error(err.message || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (questionId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.request(`/questions/${productId}`, {
        method: 'POST',
        body: JSON.stringify({ text: replyText.trim(), parent_id: questionId }),
      });
      setReplyText('');
      setReplyingTo(null);
      toast.success('Ответ отправлен');
      loadQuestions();
    } catch (err) {
      toast.error(err.message || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const rootQuestions = questions.filter(q => !q.parent_id);
  const getAnswers = (questionId) => questions.filter(q => q.parent_id === questionId);

  return (
    <div className="glass-card rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">💬</span>
        <h2 className="text-lg font-bold text-white">{t('questions')} ({rootQuestions.length})</h2>
      </div>

      {/* Ask question form */}
      {user ? (
        <form onSubmit={handleAsk} className="mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder={t('askQuestion') + '...'}
                className="w-full h-20 p-3 glass-input rounded-xl text-white text-sm resize-none placeholder-gray-600"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !newQuestion.trim()}
                  className="glass-button px-4 py-1.5 text-white text-sm font-semibold rounded-xl disabled:opacity-40"
                >
                  {submitting ? t('loading') : t('submit')}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 mb-6 bg-white/[0.02] rounded-xl border border-white/5">
          <p className="text-sm text-gray-500">Войдите, чтобы задать вопрос</p>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-shimmer" />
          ))}
        </div>
      ) : rootQuestions.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-3">🤔</div>
          <p className="text-gray-500 text-sm">{t('noQuestions')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rootQuestions.map((q, i) => {
            const answers = getAnswers(q.id);
            return (
              <div key={q.id} className="rounded-xl border border-white/5 overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
                {/* Question */}
                <div className="p-4 bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center text-primary-400 text-[10px] font-bold shrink-0 mt-0.5">
                      Q
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 leading-relaxed">{q.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600">{q.author_name || 'Пользователь'}</span>
                        <span className="text-xs text-gray-700">·</span>
                        <span className="text-xs text-gray-600">{new Date(q.created_at).toLocaleDateString('ru')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Answers */}
                {answers.length > 0 && (
                  <div className="border-t border-white/5">
                    {answers.map(a => (
                      <div key={a.id} className="p-4 bg-accent-500/[0.03]">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-accent-500/15 flex items-center justify-center text-accent-400 text-[10px] font-bold shrink-0 mt-0.5">
                            A
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 leading-relaxed">{a.text}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-accent-400/60">{a.author_name || 'Продавец'}</span>
                              <span className="text-xs text-gray-700">·</span>
                              <span className="text-xs text-gray-600">{new Date(a.created_at).toLocaleDateString('ru')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form */}
                {user && (
                  <div className="border-t border-white/5">
                    {replyingTo === q.id ? (
                      <div className="p-3 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t('answer') + '...'}
                          className="flex-1 h-9 px-3 glass-input rounded-lg text-white text-xs"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleReply(q.id); if (e.key === 'Escape') setReplyingTo(null); }}
                        />
                        <button
                          onClick={() => handleReply(q.id)}
                          disabled={submitting || !replyText.trim()}
                          className="glass-button px-3 text-white text-xs rounded-lg disabled:opacity-40"
                        >
                          {t('submit')}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          className="px-3 py-1 text-gray-500 hover:text-white text-xs rounded-lg hover:bg-white/5 transition"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(q.id)}
                        className="w-full p-2 text-xs text-gray-500 hover:text-accent-400 hover:bg-accent-500/5 transition text-left"
                      >
                        {t('answer')} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
