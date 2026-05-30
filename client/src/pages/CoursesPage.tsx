import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCourses } from '@/lib/contentApi';
import { getErrorMessage } from '@/lib/api';
import type { Course } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import LanguageBadge from '@/components/LanguageBadge';
import SearchBar from '@/components/SearchBar';

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
        <h1 className="text-2xl font-bold text-gray-900">Khoá học</h1>
        <SearchBar />
      </div>

      {loading && <Spinner />}
      {error && <Alert type="error">{error}</Alert>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.slug}`}
              className="block p-5 bg-white rounded-lg border border-gray-200 hover:border-brand-400 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{course.title}</h2>
                <LanguageBadge language={course.language} />
              </div>
              <p className="mt-2 text-sm text-gray-600">{course.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
