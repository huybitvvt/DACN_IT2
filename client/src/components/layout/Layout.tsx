import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AIChatWidget from '@/components/AIChatWidget';

// Layout chung: header cố định, nội dung ở giữa, footer dưới cùng.
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Liên kết bỏ qua điều hướng cho người dùng bàn phím/đọc màn hình */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-white dark:focus:bg-slate-800 dark:focus:text-white focus:px-3 focus:py-2 focus:rounded focus:shadow"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Header />
      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}
