import { useEffect, useState } from 'react';
import { BookOpenCheck, CalendarCheck2, CheckCircle2, Medal, Trophy } from 'lucide-react';
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/leaderboardApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard()
      .then((result) => setRows(result.leaderboard))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Trophy className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Bảng xếp hạng 30 ngày
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Chỉ tính hoạt động gần đây; mỗi bài code và quiz dùng kết quả tốt nhất để bảo đảm công
          bằng.
        </p>
      </div>

      <div className="grid gap-2 rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-ink-800 sm:grid-cols-4">
        <Rule label="Bài học" value="20đ, tối đa 200" />
        <Rule label="Bài code" value="35đ, tối đa 250" />
        <Rule label="Quiz" value="Tối đa 150" />
        <Rule label="Độ đều" value="Tối đa 100" />
      </div>

      {rows.length === 0 ? (
        <Alert type="info">Chưa có dữ liệu xếp hạng trong 30 ngày gần đây.</Alert>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, index) => (
            <li
              key={`${row.displayName}-${index}`}
              className={`flex items-center gap-4 rounded-lg border p-4 ${
                index < 3
                  ? 'border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-ink-800'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white font-black text-gray-700 shadow-sm dark:bg-slate-900 dark:text-gray-200">
                {index < 3 ? <Medal className="h-5 w-5 text-amber-600" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                  {row.displayName}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <BookOpenCheck className="h-3.5 w-3.5" /> {row.completed} bài học
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {row.passedExercises} bài pass
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck2 className="h-3.5 w-3.5" /> {row.activeDays} ngày học
                  </span>
                </div>
              </div>
              <span className="text-lg font-black text-brand-600 dark:text-brand-300">
                {row.score} đ
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{value}</p>
    </div>
  );
}
