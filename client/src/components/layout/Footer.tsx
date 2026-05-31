import { Link } from 'react-router-dom';
import { Code2, Heart } from 'lucide-react';

const footerLinks = [
  {
    title: 'Khoá học',
    links: [
      { label: 'Python', to: '/courses/python' },
      { label: 'SQL', to: '/courses/sql' },
      { label: 'C', to: '/courses/c' },
      { label: 'C++', to: '/courses/cpp' },
    ],
  },
  {
    title: 'Khám phá',
    links: [
      { label: 'Tất cả khoá học', to: '/courses' },
      { label: 'Bảng xếp hạng', to: '/leaderboard' },
      { label: 'Tiến độ', to: '/dashboard' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-12 border-t border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Vạch gradient mảnh ở mép trên */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Thương hiệu */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold text-gray-900 dark:text-white">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glowBrand">
                <Code2 className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span>
                Code<span className="text-brand-500">Learn</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-slate-400">
              Nền tảng học lập trình tương tác cho SQL, C, C++ và Python. Học bằng cách thực hành,
              chạy code ngay trên trình duyệt.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com/huybitvvt/DACN_IT2"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Mã nguồn trên GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-brand-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.37-3.87-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A10.53 10.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Cột liên kết */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-600 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} CodeLearn — Đồ án chuyên ngành.</p>
          <p className="flex items-center gap-1.5">
            Xây bằng <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> với React &amp;
            TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
}
