import { useEffect, useState } from 'react';
import { adminListUsers, type AdminUser } from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminListUsers()
      .then(setUsers)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Người dùng ({users.length})</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
        <table className="w-full text-sm bg-white dark:bg-slate-900">
          <thead className="bg-gray-50 dark:bg-slate-800/60 text-left text-gray-600 dark:text-slate-300">
            <tr>
              <th className="p-3 font-semibold">Tên</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Vai trò</th>
              <th className="p-3 font-semibold">Streak</th>
              <th className="p-3 font-semibold">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 dark:text-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-slate-800">
                <td className="p-3">{u.displayName}</td>
                <td className="p-3 text-gray-500 dark:text-slate-400">{u.email}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3">🔥 {u.streakCount}</td>
                <td className="p-3 text-gray-500 dark:text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
