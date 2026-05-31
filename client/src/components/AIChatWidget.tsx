import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Bot, X, Send, Sparkles, RotateCcw } from 'lucide-react';
import { sendChatStream, type ChatHistoryItem } from '@/lib/aiApi';
import { getErrorMessage } from '@/lib/api';

interface Message extends ChatHistoryItem {
  id: number;
}

// Widget chat AI nổi ở góc màn hình. Tự gắn ngữ cảnh bài học nếu đang xem.
export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Nếu đang ở trang bài học, lấy lessonId để đưa vào ngữ cảnh.
  const params = useParams();
  const lessonId = (params as { id?: string }).id;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function submitMessage(text: string) {
    setError('');
    const userMsg: Message = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history: ChatHistoryItem[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      // Tạo sẵn tin nhắn assistant rỗng rồi nối token dần (hiệu ứng gõ chữ).
      const assistantId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      await sendChatStream(text, { lessonId, history }, (token) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m)),
        );
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Trợ lý AI gặp sự cố. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    void submitMessage(text);
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) void submitMessage(lastUser.content);
  }

  const suggestions = ['Giải thích lỗi này', 'Cho ví dụ về vòng lặp', 'SQL JOIN là gì?'];

  return (
    <>
      {/* Nút mở chat */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-softLg transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
      >
        {/* Vòng sóng pulse khi đang đóng */}
        {!open && (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/60" />
            {/* Chấm thông báo */}
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-75" />
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-ink-900">
                1
              </span>
            </span>
          </>
        )}
        <span className="relative transition-transform duration-300 group-hover:rotate-6">
          {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </span>
      </button>

      {/* Khung chat */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[30rem] w-[92vw] max-w-sm animate-scale-in flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-softLg dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-3.5 text-white">
            <div
              className="absolute inset-0 opacity-20"
              aria-hidden="true"
              style={{
                backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative flex items-center gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-600 bg-emerald-400" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Trợ lý CodeLearn</h2>
                <p className="flex items-center gap-1 text-xs text-brand-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Trực tuyến · SQL, C, C++, Python
                </p>
              </div>
            </div>
          </div>

          {/* Danh sách tin nhắn */}
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900/50"
          >
            {messages.length === 0 && (
              <div className="mt-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                  <Sparkles className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Chào bạn! 👋
                </p>
                <p className="mx-auto mt-1 max-w-[16rem] text-sm text-slate-500 dark:text-slate-400">
                  Hỏi mình bất cứ điều gì về lập trình trong khoá học nhé.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => void submitMessage(s)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-500">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : 'rounded-bl-sm bg-white text-slate-800 shadow-soft dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {m.content || (
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="text-center">
                <p className="text-sm text-rose-500">{error}</p>
                <button
                  onClick={retryLast}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Thử lại
                </button>
              </div>
            )}
          </div>

          {/* Ô nhập */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              aria-label="Nhập câu hỏi cho trợ lý AI"
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Gửi"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white transition-all hover:shadow-glowBrand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
