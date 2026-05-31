import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

// Nút chuyển chế độ sáng/tối.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
      className="rounded-md p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
