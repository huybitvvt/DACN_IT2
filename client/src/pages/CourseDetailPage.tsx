import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCourse, type CourseWithLessons } from '@/lib/contentApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import LanguageBadge from '@/components/LanguageBadge';
import { formatVnd } from '@/lib/format';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchCourse(slug)
      .then(setCourse)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!course) return null;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500 dark:text-slate-400">
        <Link to="/courses" className="hover:underline">
          Khoá học
        </Link>{' '}
        / <span className="text-gray-700 dark:text-slate-300">{course.title}</span>
      </nav>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
        <LanguageBadge language={course.language} />
      </div>
      <p className="text-gray-600 dark:text-slate-400">{course.description}</p>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">Giá khoá học</p>
          <p className="text-2xl font-extrabold text-brand-700 dark:text-brand-300">
            {formatVnd(course.priceVnd)}
          </p>
        </div>
        {course.isPurchased ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Đã mở khoá
          </span>
        ) : (
          <Link
            to={`/courses/${course.slug}/checkout`}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5"
          >
            {course.purchaseStatus === 'PENDING' ? 'Tiếp tục thanh toán' : 'Mua khoá học'}
          </Link>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Nội dung khoá học</h2>
        <ol className="space-y-2">
          {course.lessons.map((lesson, idx) => (
            <li key={lesson.id}>
              <Link
                to={course.isPurchased ? `/lessons/${lesson.id}` : `/courses/${course.slug}/checkout`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500/60 hover:shadow-soft transition-all"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 text-sm flex items-center justify-center font-medium">
                  {idx + 1}
                </span>
                <span className="text-gray-800 dark:text-slate-200">{lesson.title}</span>
                {!course.isPurchased && (
                  <span className="ml-auto text-xs font-semibold text-gray-500 dark:text-slate-400">Khoá</span>
                )}
              </Link>
            </li>
          ))}
        </ol>
        {course.lessons.length === 0 && (
          <p className="text-gray-500 dark:text-slate-400">Khoá học này chưa có bài học.</p>
        )}
      </div>
    </div>
  );
}
