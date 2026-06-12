import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Mail, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { requestRegistrationCode, verifyRegistrationCode } from '@/lib/authApi';
import { getErrorMessage } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Alert from '@/components/ui/Alert';

type RegisterStep = 'form' | 'verify';

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<RegisterStep>('form');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validate cơ bản phía client trước khi gọi API.
  function clientValidate(): string | null {
    if (displayName.trim().length < 2) return 'Tên hiển thị phải có ít nhất 2 ký tự.';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    return null;
  }

  async function sendCode() {
    const response = await requestRegistrationCode({ email, displayName, password });
    setStep('verify');
    setCode('');
    setNotice(`${response.message} Mã hết hạn sau ${response.expiresInMinutes} phút.`);
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
      await sendCode();
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi được mã xác thực.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Mã xác thực gồm 6 chữ số.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await verifyRegistrationCode({ email, code: code.trim() });
      setUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Xác thực thất bại.'));
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
      await sendCode();
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi lại được mã xác thực.'));
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
            {step === 'form' ? 'Đăng ký tài khoản' : 'Xác thực email'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {step === 'form'
              ? 'Bắt đầu hành trình học lập trình của bạn.'
              : `Nhập mã 6 số đã gửi đến ${email}.`}
          </p>
        </div>

        <form
          onSubmit={step === 'form' ? handleSubmit : handleVerify}
          className="space-y-4 px-7 py-6"
          noValidate
        >
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
                {submitting ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
              </button>
            </>
          ) : (
            <>
              <TextField
                id="verificationCode"
                label="Mã xác thực"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 py-2.5 font-semibold text-white shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-glowBrand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <ShieldCheck className="h-4 w-4" />
                {submitting ? 'Đang xác thực...' : 'Xác nhận đăng ký'}
              </button>
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
                    setCode('');
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
