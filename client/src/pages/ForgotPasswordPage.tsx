import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Mail } from 'lucide-react';
import { forgotPasswordRequest } from '@/lib/authApi';
import { getErrorMessage } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Alert from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const message = await forgotPasswordRequest({ email });
      setNotice(message);
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi được link đặt lại mật khẩu.'));
    } finally {
      setSubmitting(false);
    }
  }

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
            Quên mật khẩu
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Nhận link đặt lại mật khẩu qua email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6" noValidate>
          {error && <Alert type="error">{error}</Alert>}
          {notice && <Alert type="success">{notice}</Alert>}
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
          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 py-2.5 font-semibold text-white shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-glowBrand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Mail className="h-4 w-4" />
            {submitting ? 'Đang gửi link...' : 'Gửi link đặt lại'}
          </button>

          <p className="pt-1 text-center text-sm text-gray-600 dark:text-slate-400">
            Nhớ mật khẩu?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
