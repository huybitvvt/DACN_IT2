import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Code2,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Flame,
  Shield,
  User as UserIcon,
  ReceiptText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/courses', label: 'Khoá học' },
  { to: '/dashboard', label: 'Tiến độ' },
  { to: '/leaderboard', label: 'Xếp hạng' },
];

/** Lấy chữ cái viết tắt từ tên hiển thị làm avatar dự phòng. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'text-white'
        : 'text-slate-300 hover:text-white'
    } after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand-400 after:transition-all after:duration-300 ${
      isActive ? 'after:opacity-100' : 'after:opacity-0 after:scale-x-0 hover:after:opacity-60 hover:after:scale-x-100'
    }`;

  async function handleLogout() {
    setProfileOpen(false);
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold text-white"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glowBrand">
            <Code2 className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span>
            Code<span className="text-brand-400">Learn</span>
          </span>
        </Link>

        {/* Điều hướng desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
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

        {/* Khu vực phải */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 transition-colors hover:bg-white/10"
              >
                {/* Avatar + chấm trạng thái */}
                <span className="relative">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                    {initials(user.displayName)}
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
                </span>
                <span className="max-w-[8rem] truncate text-sm font-medium text-white">
                  {user.displayName}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-softLg"
                >
                  {/* Header dropdown */}
                  <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                      {initials(user.displayName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {user.displayName}
                      </p>
                      <p className="truncate text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  {/* Chuỗi ngày học */}
                  <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5 text-sm text-slate-300">
                    <Flame className="h-4 w-4 text-amber-400" />
                    Chuỗi học:
                    <strong className="text-white">{user.streakCount} ngày</strong>
                  </div>

                  {/* Liên kết */}
                  <nav className="py-1" aria-label="Menu tài khoản">
                    <Link
                      to="/dashboard"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Bảng điều khiển
                    </Link>
                    <Link
                      to="/purchases"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <ReceiptText className="h-4 w-4" />
                      Lịch sử mua
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Shield className="h-4 w-4" />
                        Trang quản trị
                      </Link>
                    )}
                    <button
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className="flex w-full items-center gap-3 border-t border-slate-800 px-4 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 px-4 py-1.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glowBrand"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Nút menu mobile */}
        <button
          className="rounded-md p-2 text-slate-200 transition-colors hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <nav
          className="animate-fade-in border-t border-white/5 bg-slate-950 px-4 py-3 md:hidden"
          aria-label="Điều hướng di động"
        >
          {/* Thông tin người dùng trên mobile */}
          {user && (
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
              <span className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                  {initials(user.displayName)}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
                <p className="flex items-center gap-1 text-xs text-amber-400">
                  <Flame className="h-3 w-3" />
                  {user.streakCount} ngày
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-300'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Quản trị
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/purchases"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Lịch sử mua
              </NavLink>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-3">
            <ThemeToggle />
            {user ? (
              <button
                onClick={() => void handleLogout()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            ) : (
              <div className="flex flex-1 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
                >
                  <UserIcon className="h-4 w-4" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
