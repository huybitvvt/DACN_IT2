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
      <h1 className="text-2xl font-bold text-gray-900">Người dùng ({users.length})</h1>
      <table className="w-full text-sm bg-white rounded-lg border border-gray-200 overflow-hidden">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Tên</th>
            <th className="p-3">Email</th>
            <th className="p-3">Vai trò</th>
            <th className="p-3">Streak</th>
            <th className="p-3">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-gray-100">
              <td className="p-3">{u.displayName}</td>
              <td className="p-3 text-gray-500">{u.email}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="p-3">🔥 {u.streakCount}</td>
              <td className="p-3 text-gray-500">
                {new Date(u.createdAt).toLocaleDateString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
