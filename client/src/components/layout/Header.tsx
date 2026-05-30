import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/courses', label: 'Khoá học' },
  { to: '/dashboard', label: 'Tiến độ' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-brand-700 text-lg">
          Học Lập Trình
        </Link>

        {/* Điều hướng desktop */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-brand-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-brand-700'
                }`
              }
            >
              Quản trị
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-gray-600">Xin chào, {user.displayName}</span>
              <button
                onClick={() => void logout()}
                className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm px-3 py-1.5 text-gray-600 hover:text-brand-700">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-sm px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Nút menu mobile */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Mở menu"
          aria-expanded={menuOpen}
        >
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-200 px-4 py-2 space-y-1" aria-label="Điều hướng di động">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Quản trị
            </NavLink>
          )}
          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="block w-full text-left px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Đăng xuất
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded text-sm text-brand-700 font-medium hover:bg-gray-50"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
