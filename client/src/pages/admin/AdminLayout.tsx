import { NavLink, Outlet } from 'react-router-dom';

const adminNav = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/courses', label: 'Khoá học' },
  { to: '/admin/lessons', label: 'Bài học' },
  { to: '/admin/exercises', label: 'Bài tập' },
  { to: '/admin/users', label: 'Người dùng' },
];

export default function AdminLayout() {
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <aside>
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Quản trị</h2>
        <nav className="space-y-1">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm ${
                  isActive ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
