import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/lib/notificationApi';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const initializedRef = useRef(false);
  const knownIdsRef = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchNotifications(30);
      if (initializedRef.current) {
        const incoming = data.notifications
          .filter((item) => !item.readAt && !knownIdsRef.current.has(item.id))
          .slice(0, 3)
          .map((item) => ({ id: item.id, title: item.title, message: item.message }));
        if (incoming.length > 0) setToasts((current) => [...incoming, ...current].slice(0, 3));
      }
      knownIdsRef.current = new Set(data.notifications.map((item) => item.id));
      initializedRef.current = true;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      initializedRef.current = false;
      knownIdsRef.current.clear();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [refresh, user]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(0, -1)), 5000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  async function markRead(id: string) {
    const wasUnread = notifications.some((item) => item.id === id && !item.readAt);
    const updated = await markNotificationRead(id);
    setNotifications((current) => current.map((item) => (item.id === id ? updated : item)));
    if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function markAllRead() {
    await markAllNotificationsRead();
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    setUnreadCount(0);
  }

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead }}
    >
      {children}
      <div
        className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-fade-in rounded-lg border border-brand-300 bg-white p-4 shadow-softLg dark:border-brand-800 dark:bg-slate-900"
          >
            <p className="font-bold text-gray-900 dark:text-white">{toast.title}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{toast.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications phải nằm trong NotificationProvider.');
  return context;
}
