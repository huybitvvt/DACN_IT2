import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchLesson, type LessonDetail } from '@/lib/contentApi';
import { getErrorMessage } from '@/lib/api';
import { renderMarkdown } from '@/lib/markdown';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import ExampleBlock from '@/components/ExampleBlock';
import LessonSidebar from '@/components/LessonSidebar';
import LessonNotePanel from '@/components/LessonNotePanel';
import LessonComments from '@/components/LessonComments';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0 });
    fetchLesson(id)
      .then(setLesson)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const html = useMemo(() => (lesson ? renderMarkdown(lesson.contentMarkdown) : ''), [lesson]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!lesson) return null;

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 -mt-2">
      {/* Sidebar bài học (W3Schools style) */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto bg-white dark:bg-ink-800 rounded-xl border border-gray-200 dark:border-gray-700 py-2">
          <LessonSidebar courseSlug={lesson.course.slug} currentLessonId={lesson.id} />
        </div>
      </aside>

      {/* Nút mở danh sách bài (mobile) */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="lg:hidden mb-3 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-ink-800 text-gray-700 dark:text-gray-200"
      >
        ☰ Danh sách bài học
      </button>
      {sidebarOpen && (
        <div className="lg:hidden mb-4 bg-white dark:bg-ink-800 rounded-xl border border-gray-200 dark:border-gray-700 py-2">
          <LessonSidebar
            courseSlug={lesson.course.slug}
            currentLessonId={lesson.id}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <article className="min-w-0 max-w-3xl animate-fade-in">
        <nav className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Link to="/courses" className="hover:text-brand-600">
            Khoá học
          </Link>{' '}
          /{' '}
          <Link to={`/courses/${lesson.course.slug}`} className="hover:text-brand-600">
            {lesson.course.title}
          </Link>{' '}
          / <span className="text-gray-700 dark:text-gray-300">{lesson.title}</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">{lesson.title}</h1>

        {/* Nút điều hướng trên (W3Schools đặt Next/Prev cả trên lẫn dưới) */}
        <NavButtons lesson={lesson} />

        {/* Nội dung lý thuyết */}
        <div
          className="lesson-content text-gray-800 mt-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Ví dụ code */}
        {lesson.examples.length > 0 && (
          <section className="space-y-4 mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-accent-500">▶</span> Ví dụ — Thử ngay
            </h2>
            {lesson.examples.map((ex) => (
              <ExampleBlock key={ex.id} language={ex.language} code={ex.code} />
            ))}
          </section>
        )}

        {/* Bài tập */}
        {lesson.exercises.length > 0 && (
          <section className="space-y-2 mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">📝 Bài tập</h2>
            <ul className="space-y-2">
              {lesson.exercises.map((ex) => (
                <li key={ex.id}>
                  <Link
                    to={`/exercises/${ex.id}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-ink-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:shadow-card transition group"
                  >
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{ex.title}</span>
                    <span className="text-sm text-brand-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Làm bài →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Quiz */}
        {lesson.quiz && (
          <section className="mt-8">
            <Link
              to={`/lessons/${lesson.id}/quiz`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-ink-900 font-bold hover:bg-accent-600 transition"
            >
              🎯 Làm quiz kiểm tra
            </Link>
          </section>
        )}

        {/* Ghi chú cá nhân + bookmark */}
        <LessonNotePanel lessonId={lesson.id} />

        {/* Thảo luận */}
        <LessonComments lessonId={lesson.id} />

        {/* Điều hướng dưới */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <NavButtons lesson={lesson} />
        </div>
      </article>
    </div>
  );
}

// Cụm nút Previous / Next kiểu W3Schools.
function NavButtons({ lesson }: { lesson: LessonDetail }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {lesson.prev ? (
        <Link
          to={`/lessons/${lesson.prev.id}`}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition"
        >
          ❮ Trước
        </Link>
      ) : (
        <span className="px-4 py-2 rounded-lg bg-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed">
          ❮ Trước
        </span>
      )}
      {lesson.next ? (
        <Link
          to={`/lessons/${lesson.next.id}`}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition"
        >
          Tiếp ❯
        </Link>
      ) : (
        <span className="px-4 py-2 rounded-lg bg-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed">
          Tiếp ❯
        </span>
      )}
    </div>
  );
}
