import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Mail, RefreshCw, UserPlus } from 'lucide-react';
import { requestRegistrationCode } from '@/lib/authApi';
import { apiUrl, getErrorMessage } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Alert from '@/components/ui/Alert';

type RegisterStep = 'form' | 'sent';

export default function RegisterPage() {
  const [step, setStep] = useState<RegisterStep>('form');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validate cơ bản phía client trước khi gọi API.
  function clientValidate(): string | null {
    if (displayName.trim().length < 2) return 'Tên hiển thị phải có ít nhất 2 ký tự.';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    return null;
  }

  async function sendVerificationLink() {
    const response = await requestRegistrationCode({ email, displayName, password });
    setStep('sent');
    setNotice(`${response.message} Link hết hạn sau ${response.expiresInMinutes} phút.`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    const validationError = clientValidate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await sendVerificationLink();
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi được link xác thực.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError('');
    setNotice('');
    const validationError = clientValidate();
    if (validationError) {
      setStep('form');
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await sendVerificationLink();
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi lại được link xác thực.'));
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
            {step === 'form' ? 'Đăng ký tài khoản' : 'Kiểm tra email'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {step === 'form'
              ? 'Bắt đầu hành trình học lập trình của bạn.'
              : `Bấm link xác thực đã gửi đến ${email}.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6" noValidate>
          {error && <Alert type="error">{error}</Alert>}
          {notice && <Alert type="success">{notice}</Alert>}
          {step === 'form' ? (
            <>
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
                <Mail className="h-4 w-4" />
                {submitting ? 'Đang gửi link...' : 'Gửi link xác thực'}
              </button>
              <a
                href={apiUrl('/auth/google')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <span className="font-bold text-red-500">G</span>
                Đăng ký với Google
              </a>
            </>
          ) : (
            <>
              <Alert type="info">
                Mở email {email} và bấm link xác thực để hoàn tất đăng ký. Sau khi bấm link,
                tài khoản sẽ được tạo và đăng nhập tự động.
              </Alert>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResend}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Gửi lại
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setStep('form');
                    setNotice('');
                    setError('');
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <UserPlus className="h-4 w-4" />
                  Đổi email
                </button>
              </div>
            </>
          )}

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
