import { useEffect, useState } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/leaderboardApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard()
      .then(setRows)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">🏆 Bảng xếp hạng</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Top người học chăm chỉ nhất. Điểm = bài hoàn thành + chuỗi ngày học + huy hiệu.
        </p>
      </div>

      {rows.length === 0 ? (
        <Alert type="info">Chưa có dữ liệu xếp hạng. Hãy là người đầu tiên!</Alert>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                i < 3
                  ? 'bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/20 dark:to-ink-800 border-brand-200 dark:border-brand-800'
                  : 'bg-white dark:bg-ink-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="w-8 text-center text-xl font-bold text-gray-500 dark:text-gray-400">
                {medals[i] ?? i + 1}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{r.displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {r.completed} mục · 🔥 {r.streak} · 🏅 {r.badges}
                </p>
              </div>
              <span className="font-bold text-brand-600 dark:text-brand-400">{r.score} đ</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
