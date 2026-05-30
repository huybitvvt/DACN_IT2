import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/courses', label: 'Khoá học' },
  { to: '/dashboard', label: 'Tiến độ' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-500 text-white' : 'text-gray-200 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="bg-ink-900 sticky top-0 z-40 shadow-md">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-white text-lg">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-brand-500 text-white">
            {'</>'}
          </span>
          <span>
            Code<span className="text-brand-400">Learn</span>
          </span>
        </Link>

        {/* Điều hướng desktop */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={linkClass}>
              Quản trị
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-sm text-gray-300">
                Xin chào, <strong className="text-white">{user.displayName}</strong>
              </span>
              <button
                onClick={() => void logout()}
                className="text-sm px-3 py-1.5 rounded-md border border-white/20 text-gray-200 hover:bg-white/10"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm px-3 py-1.5 rounded-md text-gray-200 hover:bg-white/10"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-sm px-4 py-1.5 rounded-md bg-brand-500 text-white font-semibold hover:bg-brand-400 transition-colors"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Nút menu mobile */}
        <button
          className="md:hidden p-2 text-gray-200"
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
        <nav
          className="md:hidden border-t border-white/10 px-4 py-2 space-y-1 bg-ink-900"
          aria-label="Điều hướng di động"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm text-gray-200 hover:bg-white/10"
            >
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm text-gray-200 hover:bg-white/10"
            >
              Quản trị
            </NavLink>
          )}
          <div className="pt-2 border-t border-white/10">
            {user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="block w-full text-left px-3 py-2 rounded text-sm text-gray-200 hover:bg-white/10"
              >
                Đăng xuất
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded text-sm text-gray-200 hover:bg-white/10"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded text-sm text-brand-400 font-semibold hover:bg-white/10"
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
