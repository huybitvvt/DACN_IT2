import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'info';
  children: React.ReactNode;
}

const config = {
  error: {
    style:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
    Icon: AlertCircle,
  },
  success: {
    style:
      'bg-green-50 text-green-700 border-green-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    Icon: CheckCircle2,
  },
  info: {
    style:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
    Icon: Info,
  },
};

export default function Alert({ type = 'info', children }: AlertProps) {
  const { style, Icon } = config[type];
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${style}`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
