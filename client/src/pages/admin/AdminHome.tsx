import { Link } from 'react-router-dom';
import type { ElementType } from 'react';
import { ShieldAlert, Trophy, Users } from 'lucide-react';

export default function AdminHome() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Bảng điều khiển quản trị</h1>
      <p className="text-gray-600 dark:text-slate-400">
        Chọn một mục ở bên trái để quản lý khoá học, bài học, bài tập hoặc xem danh sách người
        dùng. Các thay đổi sẽ phản ánh ngay trên giao diện người học.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <QuickLink
          to="/admin/retention"
          icon={ShieldAlert}
          title="Can thiệp sớm"
          description="Xem học viên trả phí đang có nguy cơ rơi nhịp."
        />
        <QuickLink
          to="/admin/contests"
          icon={Trophy}
          title="Thi đua có thưởng"
          description="Cấu hình ranking, phòng thi và ưu đãi."
        />
        <QuickLink
          to="/admin/users"
          icon={Users}
          title="Người dùng"
          description="Theo dõi tài khoản, vai trò và streak."
        />
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-brand-300 dark:border-gray-700 dark:bg-ink-800 dark:hover:border-brand-700"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-3 font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400">{description}</p>
    </Link>
  );
}
