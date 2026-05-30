import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { sendChat, type ChatHistoryItem } from '@/lib/aiApi';
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
      const res = await sendChat(text, { lessonId, history });
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: res.reply },
      ]);
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

  return (
    <>
      {/* Nút mở chat */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 flex items-center justify-center text-xl"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Khung chat */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm h-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-brand-600 text-white rounded-t-xl">
            <h2 className="font-semibold text-sm">Trợ lý học lập trình</h2>
            <p className="text-xs text-brand-100">Hỏi về SQL, C, C++, Python</p>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">
                Chào bạn! Hãy hỏi mình bất cứ điều gì về lập trình trong khoá học nhé.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm">
                  Đang trả lời...
                </div>
              </div>
            )}
            {error && (
              <div className="text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button onClick={retryLast} className="text-xs text-brand-700 underline mt-1">
                  Thử lại
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              aria-label="Nhập câu hỏi cho trợ lý AI"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-60"
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}
