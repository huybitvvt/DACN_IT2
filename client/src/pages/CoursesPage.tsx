import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCourses } from '@/lib/contentApi';
import { getErrorMessage } from '@/lib/api';
import type { Course } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import LanguageBadge from '@/components/LanguageBadge';
import SearchBar from '@/components/SearchBar';
import { formatVnd } from '@/lib/format';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Khoá học</h1>
        <SearchBar />
      </div>

      {loading && <Spinner />}
      {error && <Alert type="error">{error}</Alert>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course, i) => (
            <Link
              key={course.id}
              to={`/courses/${course.slug}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className="block p-5 bg-white dark:bg-ink-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:shadow-cardHover hover:-translate-y-0.5 transition-all animate-fade-in-up"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-gray-100">{course.title}</h2>
                <LanguageBadge language={course.language} />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{course.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-bold text-brand-700 dark:text-brand-300">
                  {formatVnd(course.priceVnd)}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                  {course.isPurchased ? 'Đã mua' : course.purchaseStatus === 'PENDING' ? 'Chờ thanh toán' : 'Chưa mua'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
