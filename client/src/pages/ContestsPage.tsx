import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Gift, Medal, Trophy, Users } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/api';
import { fetchContests, type ContestSummary } from '@/lib/contestApi';

const statusText: Record<ContestSummary['status'], string> = {
  UPCOMING: 'Sắp diễn ra',
  ACTIVE: 'Đang thi đua',
  FINISHED: 'Đã kết thúc',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ContestsPage() {
  const [contests, setContests] = useState<ContestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContests()
      .then(setContests)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
            Thi đua có thưởng
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Mùa thi, ranking và ưu đãi học phí
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
            Điểm theo mùa được chuẩn hóa trên thang 1.000 từ bài học, bài code, quiz, phòng thi và
            số ngày học thực tế. Top bảng xếp hạng nhận hoàn học phí, voucher hoặc huy hiệu đặc
            biệt.
          </p>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Học để tăng điểm
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {contests.length === 0 ? (
        <Alert type="info">Chưa có mùa thi đua nào.</Alert>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contests.map((contest) => (
            <article
              key={contest.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-ink-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {contest.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {contest.description}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  {statusText[contest.status]}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  {formatDate(contest.startsAt)} - {formatDate(contest.endsAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-500" />
                  {contest.participantCount} học viên có điểm
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-brand-500" />
                  {contest.rewards.length} mốc phần thưởng
                </div>
                <div className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-brand-500" />
                  Top {contest.rewards.at(-1)?.rankTo ?? 0} được ghi nhận
                </div>
              </div>

              {contest.topUsers.length > 0 && (
                <ol className="mt-4 space-y-2">
                  {contest.topUsers.map((u) => (
                    <li
                      key={u.rank}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/5"
                    >
                      <span className="w-8 text-sm font-bold text-brand-600 dark:text-brand-300">
                        #{u.rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {u.displayName}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {u.score}/1000
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <Link
                to={`/contests/${contest.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
              >
                Xem bảng xếp hạng mùa này
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
