import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProgress, type ProgressOverview } from '@/lib/progressApi';
import { fetchGamification, type GamificationData } from '@/lib/gamificationApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import ProgressBar from '@/components/ProgressBar';

export default function DashboardPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressOverview | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchProgress(), fetchGamification()])
      .then(([p, g]) => {
        setProgress(p);
        setGamification(g);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!progress) return null;

  const startedCourses = progress.courses.filter((c) => c.completed > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Xin chào, {user?.displayName}</h1>
        <p className="text-gray-600 dark:text-gray-400">Theo dõi tiến độ học tập của bạn.</p>
      </div>

      {/* Gamification: streak + huy hiệu */}
      {gamification && (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="bg-white dark:bg-ink-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Chuỗi ngày học</p>
            <p className="text-3xl font-bold text-brand-600 dark:text-brand-400 mt-1">
              🔥 {gamification.streakCount} ngày
            </p>
          </div>
          <div className="bg-white dark:bg-ink-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Huy hiệu đã đạt</p>
            {gamification.badges.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có huy hiệu nào. Hãy bắt đầu học!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {gamification.badges.map((b) => (
                  <span
                    key={b.code}
                    title={b.description}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium"
                  >
                    🏅 {b.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tiến độ theo khoá */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tiến độ theo khoá học</h2>
        <div className="space-y-4">
          {progress.courses.map((c) => (
            <div key={c.courseId} className="bg-white dark:bg-ink-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Link to={`/roadmap/${c.slug}`} className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  {c.title}
                </Link>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {c.completed}/{c.total} mục
                </span>
              </div>
              <ProgressBar percent={c.percent} />
              {c.percent === 100 && (
                <Link
                  to={`/certificate/${c.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:underline"
                >
                  🏆 Nhận chứng chỉ hoàn thành
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {startedCourses.length === 0 && (
        <Alert type="info">
          Bạn chưa bắt đầu khoá nào. <Link to="/courses" className="underline">Khám phá khoá học</Link>.
        </Alert>
      )}
    </div>
  );
}
