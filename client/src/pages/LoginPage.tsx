import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginRequest } from '@/lib/authApi';
import { getErrorMessage } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Alert from '@/components/ui/Alert';

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await loginRequest({ email, password });
      setUser(user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-xl border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Đăng nhập</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
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
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-brand-700 hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
