import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchLesson, type LessonDetail } from '@/lib/contentApi';
import { getErrorMessage } from '@/lib/api';
import { renderMarkdown } from '@/lib/markdown';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import ExampleBlock from '@/components/ExampleBlock';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    fetchLesson(id)
      .then(setLesson)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const html = useMemo(
    () => (lesson ? renderMarkdown(lesson.contentMarkdown) : ''),
    [lesson],
  );

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!lesson) return null;

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <nav className="text-sm text-gray-500">
        <Link to="/courses" className="hover:underline">
          Khoá học
        </Link>{' '}
        /{' '}
        <Link to={`/courses/${lesson.course.slug}`} className="hover:underline">
          {lesson.course.title}
        </Link>{' '}
        / <span className="text-gray-700">{lesson.title}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>

      {/* Nội dung lý thuyết (đã sanitize chống XSS) */}
      <div
        className="lesson-content text-gray-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Ví dụ code có thể chạy thử */}
      {lesson.examples.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Ví dụ — Thử ngay</h2>
          {lesson.examples.map((ex) => (
            <ExampleBlock key={ex.id} language={ex.language} code={ex.code} />
          ))}
        </section>
      )}

      {/* Bài tập của bài học */}
      {lesson.exercises.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Bài tập</h2>
          <ul className="space-y-2">
            {lesson.exercises.map((ex) => (
              <li key={ex.id}>
                <Link
                  to={`/exercises/${ex.id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-brand-400"
                >
                  <span className="text-gray-800">{ex.title}</span>
                  <span className="text-sm text-brand-700">Làm bài →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quiz nếu có */}
      {lesson.quiz && (
        <section>
          <Link
            to={`/lessons/${lesson.id}/quiz`}
            className="inline-block px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
          >
            Làm quiz kiểm tra →
          </Link>
        </section>
      )}

      {/* Điều hướng trước/sau */}
      <nav className="flex items-center justify-between pt-6 border-t border-gray-200">
        {lesson.prev ? (
          <Link
            to={`/lessons/${lesson.prev.id}`}
            className="text-brand-700 hover:underline text-sm"
          >
            ← {lesson.prev.title}
          </Link>
        ) : (
          <span />
        )}
        {lesson.next ? (
          <Link
            to={`/lessons/${lesson.next.id}`}
            className="text-brand-700 hover:underline text-sm text-right"
          >
            {lesson.next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
