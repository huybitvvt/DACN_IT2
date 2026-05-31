import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

// Thanh tìm kiếm bài học. Chuyển tới trang kết quả với query string.
export default function SearchBar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm bài học..."
        aria-label="Tìm kiếm bài học"
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
      >
        Tìm
      </button>
    </form>
  );
}
