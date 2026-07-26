import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/notificationApi';
import Alert from '@/components/ui/Alert';

const preferenceLabels: Array<[keyof NotificationPreferences, string]> = [
  ['emailPayments', 'Thanh toán và mở khoá học'],
  ['emailRewards', 'Duyệt hoặc từ chối phần thưởng'],
  ['emailContests', 'Mùa thi sắp bắt đầu hoặc kết thúc'],
  ['emailRetention', 'Nguy cơ mất nhịp và gói cứu nhịp'],
  ['emailBadges', 'Huy hiệu mới'],
];

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences().then(setPreferences).catch(() => setPreferences(null));
  }, []);

  async function savePreferences() {
    if (!preferences) return;
    setPreferences(await saveNotificationPreferences(preferences));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-brand-600 dark:text-brand-300">Trung tâm thông báo</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Hoạt động cần chú ý</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{unreadCount} thông báo chưa đọc</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-slate-200"
          >
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-ink-800">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="mx-auto h-9 w-9 text-gray-400" />
            <p className="mt-3 text-sm text-gray-500">Chưa có thông báo.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <Link
              key={item.id}
              to={item.href || '#'}
              onClick={() => !item.readAt && void markRead(item.id)}
              className={`flex gap-3 border-b border-gray-200 p-4 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5 ${
                item.readAt ? '' : 'bg-brand-50/70 dark:bg-brand-900/10'
              }`}
            >
              <span
                className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                  item.readAt ? 'bg-gray-300 dark:bg-gray-700' : 'bg-brand-500'
                }`}
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{item.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </Link>
          ))
        )}
      </section>

      {preferences && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Thông báo qua email</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {preferenceLabels.map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(event) =>
                    setPreferences((current) =>
                      current ? { ...current, [key]: event.target.checked } : current,
                    )
                  }
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="font-medium text-gray-700 dark:text-slate-200">{label}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void savePreferences()}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Lưu tùy chọn
          </button>
          {saved && <div className="mt-3"><Alert type="success">Đã lưu tùy chọn email.</Alert></div>}
        </section>
      )}
    </div>
  );
}
