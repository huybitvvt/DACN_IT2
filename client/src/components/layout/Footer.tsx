export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Học Lập Trình — Đồ án chuyên ngành.</p>
        <p>SQL · C · C++ · Python</p>
      </div>
    </footer>
  );
}
