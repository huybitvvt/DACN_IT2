import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Code2, KeyRound } from 'lucide-react';
import { resetPasswordRequest } from '@/lib/authApi';
import { getErrorMessage } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Alert from '@/components/ui/Alert';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordRequest({ email, token, password });
      navigate('/login?reset=1', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Không đặt lại được mật khẩu.'));
    } finally {
      setSubmitting(false);
    }
  }

  const invalidLink = !email || !token;

  return (
    <div className="relative mx-auto mt-6 max-w-md sm:mt-10">
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-500/15 via-transparent to-sky-500/15 blur-2xl"
        aria-hidden="true"
      />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-100 px-7 py-6 text-center dark:border-slate-800">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glowBrand">
            <Code2 className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-gray-900 dark:text-white">
            Đặt lại mật khẩu
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Chọn mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6" noValidate>
          {invalidLink && <Alert type="error">Link đặt lại mật khẩu không hợp lệ.</Alert>}
          {error && <Alert type="error">{error}</Alert>}
          <TextField id="email" label="Email" value={email} disabled />
          <TextField
            id="password"
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={invalidLink}
            required
          />
          <button
            type="submit"
            disabled={submitting || invalidLink}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 py-2.5 font-semibold text-white shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-glowBrand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <KeyRound className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
          </button>

          <p className="pt-1 text-center text-sm text-gray-600 dark:text-slate-400">
            <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Quay lại đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
