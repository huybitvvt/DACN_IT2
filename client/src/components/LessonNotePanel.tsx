import { useEffect, useState } from 'react';
import { fetchNote, saveNote } from '@/lib/engagementApi';
import { useAuth } from '@/context/AuthContext';

// Bảng ghi chú cá nhân + nút đánh dấu (bookmark) cho bài học.
export default function LessonNotePanel({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchNote(lessonId)
      .then((n) => {
        setContent(n.content);
        setBookmarked(n.bookmarked);
      })
      .catch(() => {});
  }, [lessonId, user]);

  if (!user) return null;

  async function toggleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    await saveNote(lessonId, { bookmarked: next }).catch(() => setBookmarked(!next));
  }

  async function handleSave() {
    setStatus('Đang lưu...');
    try {
      await saveNote(lessonId, { content });
      setStatus('Đã lưu ✓');
      setTimeout(() => setStatus(''), 1500);
    } catch {
      setStatus('Lưu thất bại');
    }
  }

  return (
    <section className="mt-8 bg-white dark:bg-ink-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-gray-900 dark:text-gray-100">📌 Ghi chú của bạn</h2>
        <button
          onClick={toggleBookmark}
          className={`text-sm px-3 py-1.5 rounded-lg border transition ${
            bookmarked
              ? 'bg-accent-500 text-ink-900 border-accent-500'
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
          }`}
        >
          {bookmarked ? '★ Đã đánh dấu' : '☆ Đánh dấu bài này'}
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Viết ghi chú riêng cho bài học này..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-ink-900 text-gray-800 dark:text-gray-200 text-sm"
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleSave}
          className="px-4 py-1.5 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700"
        >
          Lưu ghi chú
        </button>
        {status && <span className="text-sm text-gray-500 dark:text-gray-400">{status}</span>}
      </div>
    </section>
  );
}
