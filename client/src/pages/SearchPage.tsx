import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchLessons, type SearchResult } from '@/lib/contentApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import LanguageBadge from '@/components/LanguageBadge';
import SearchBar from '@/components/SearchBar';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    searchLessons(q)
      .then(setResults)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Kết quả tìm kiếm</h1>
        <SearchBar />
      </div>

      {q && (
        <p className="text-sm text-gray-600">
          Từ khoá: <strong>{q}</strong>
        </p>
      )}

      {loading && <Spinner />}
      {error && <Alert type="error">{error}</Alert>}

      {!loading && !error && q && results.length === 0 && (
        <p className="text-gray-500">Không tìm thấy bài học nào khớp.</p>
      )}

      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.id}>
            <Link
              to={`/lessons/${r.id}`}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-brand-400"
            >
              <span className="text-gray-800">{r.title}</span>
              <span className="flex items-center gap-2 text-sm text-gray-500">
                {r.course.title}
                <LanguageBadge language={r.course.language} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
