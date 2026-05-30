import { useEffect, useState, type FormEvent } from 'react';
import { addComment, deleteComment, fetchComments, type Comment } from '@/lib/engagementApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Khu vực bình luận/hỏi đáp dưới bài học.
export default function LessonComments({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetchComments(lessonId).then(setComments).catch(() => {});
  }

  useEffect(load, [lessonId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    setError('');
    try {
      await addComment(lessonId, text);
      setContent('');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteComment(id).catch(() => {});
    load();
  }

  return (
    <section className="mt-8">
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
        💬 Thảo luận ({comments.length})
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-ink-900 text-gray-800 dark:text-gray-200 text-sm"
          />
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 px-4 py-1.5 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Gửi bình luận
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Đăng nhập để tham gia thảo luận.
        </p>
      )}

      <ul className="space-y-3">
        {comments.map((c) => (
          <li
            key={c.id}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-ink-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {c.user.displayName}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {c.content}
            </p>
            {user && (
              <button
                onClick={() => handleDelete(c.id)}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                Xoá
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
