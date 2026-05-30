import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-xl border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Đăng ký tài khoản</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <TextField
          id="displayName"
          label="Tên hiển thị"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          id="password"
          label="Mật khẩu (tối thiểu 8 ký tự)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-brand-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
