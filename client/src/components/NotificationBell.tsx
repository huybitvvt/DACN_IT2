import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { formatRelativeTime } from '@/lib/format';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        aria-label={`Thông báo, ${unreadCount} chưa đọc`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-softLg">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="font-bold text-white">Thông báo</p>
              <p className="text-xs text-slate-400">{unreadCount} chưa đọc</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200"
              >
                <CheckCheck className="h-4 w-4" />
                Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                to={item.href || '/notifications'}
                onClick={() => {
                  setOpen(false);
                  if (!item.readAt) void markRead(item.id);
                }}
                className={`block border-b border-slate-800 px-4 py-3 transition-colors hover:bg-white/5 ${
                  item.readAt ? '' : 'bg-brand-500/10'
                }`}
              >
                <div className="flex gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      item.readAt ? 'bg-slate-600' : 'bg-brand-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-400">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Chưa có thông báo.</p>
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-semibold text-brand-300 hover:bg-white/5"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </div>
  );
}
