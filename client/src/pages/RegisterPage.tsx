import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { registerRequest } from '@/lib/authApi';
import { getErrorMessage } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Alert from '@/components/ui/Alert';

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validate cơ bản phía client trước khi gọi API.
  function clientValidate(): string | null {
    if (displayName.trim().length < 2) return 'Tên hiển thị phải có ít nhất 2 ký tự.';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const validationError = clientValidate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const user = await registerRequest({ email, displayName, password });
      setUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative mx-auto mt-6 max-w-md sm:mt-10">
      {/* Hào quang nền sau thẻ */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-500/15 via-transparent to-sky-500/15 blur-2xl"
        aria-hidden="true"
      />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        {/* Header thẻ */}
        <div className="border-b border-gray-100 px-7 py-6 text-center dark:border-slate-800">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glowBrand">
            <Code2 className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-gray-900 dark:text-white">
            Đăng ký tài khoản
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Bắt đầu hành trình học lập trình của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6" noValidate>
          {error && <Alert type="error">{error}</Alert>}
          <TextField
            id="displayName"
            label="Tên hiển thị"
            placeholder="Nguyễn Văn A"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            id="password"
            label="Mật khẩu (tối thiểu 8 ký tự)"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 py-2.5 font-semibold text-white shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-glowBrand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <UserPlus className="h-4 w-4" />
            {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>

          <p className="pt-1 text-center text-sm text-gray-600 dark:text-slate-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
