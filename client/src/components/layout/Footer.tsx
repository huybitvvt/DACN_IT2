export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-ink-800 transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} CodeLearn — Đồ án chuyên ngành.</p>
        <p>SQL · C · C++ · Python</p>
      </div>
    </footer>
  );
}
