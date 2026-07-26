import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Loader2, QrCode, RefreshCw, TestTube2 } from 'lucide-react';
import {
  confirmDemoCoursePayment,
  createCourseCheckout,
  getCourseCheckoutStatus,
  type CourseCheckout,
} from '@/lib/paymentApi';
import { getErrorMessage } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState<CourseCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [demoConfirming, setDemoConfirming] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const refreshStatus = useCallback(
    async (options: { manual?: boolean } = {}) => {
      if (!slug) return;
      if (options.manual) setChecking(true);
      setError('');
      try {
        const purchase = await getCourseCheckoutStatus(slug);
        setCheckout((current) => (current ? { ...current, purchase } : current));
        if (purchase.status === 'PAID') {
          setPaid(true);
          window.setTimeout(() => navigate(`/courses/${slug}`, { replace: true }), 1600);
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Không kiểm tra được trạng thái thanh toán.'));
      } finally {
        if (options.manual) setChecking(false);
      }
    },
    [navigate, slug],
  );

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    createCourseCheckout(slug)
      .then((nextCheckout) => {
        setCheckout(nextCheckout);
        if (nextCheckout.purchase.status === 'PAID') setPaid(true);
      })
      .catch((err) => setError(getErrorMessage(err, 'Không tạo được mã thanh toán.')))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const purchaseId = checkout?.purchase.id;
    if (!slug || !purchaseId || paid) return;

    let stopped = false;
    const pollStatus = () => {
      if (!stopped) void refreshStatus();
    };

    void pollStatus();
    const intervalId = window.setInterval(pollStatus, 4000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [checkout?.purchase.id, paid, refreshStatus, slug]);

  async function handleCopy() {
    if (!checkout) return;
    await navigator.clipboard.writeText(checkout.purchase.paymentCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleRenewCheckout() {
    if (!slug) return;
    setRenewing(true);
    setError('');
    try {
      const nextCheckout = await createCourseCheckout(slug);
      setCheckout(nextCheckout);
      setPaid(nextCheckout.purchase.status === 'PAID');
    } catch (err) {
      setError(getErrorMessage(err, 'Không tạo được mã thanh toán mới.'));
    } finally {
      setRenewing(false);
    }
  }

  async function handleDemoConfirm() {
    if (!slug) return;
    setDemoConfirming(true);
    setError('');
    try {
      const purchase = await confirmDemoCoursePayment(slug);
      setCheckout((current) => (current ? { ...current, purchase } : current));
      setPaid(true);
      window.setTimeout(() => navigate(`/courses/${slug}`, { replace: true }), 1200);
    } catch (err) {
      setError(getErrorMessage(err, 'Không xác nhận được thanh toán demo.'));
    } finally {
      setDemoConfirming(false);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return '';
    return new Date(value).toLocaleString('vi-VN');
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="text-sm text-gray-500 dark:text-slate-400">
        <Link to="/courses" className="hover:underline">
          Khoá học
        </Link>{' '}
        / <span>Thanh toán</span>
      </nav>

      {error && <Alert type="error">{error}</Alert>}
      {!checkout && !error && <Alert type="error">Không tìm thấy thông tin thanh toán.</Alert>}

      {checkout && (
        <div className="grid gap-6 md:grid-cols-[320px,1fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <QrCode className="h-5 w-5 text-brand-600" />
              Quét mã thanh toán
            </div>
            <img
              src={checkout.qrUrl}
              alt="QR thanh toán khoá học"
              className="aspect-square w-full rounded-lg border border-gray-100 bg-white object-contain"
            />
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{checkout.course.title}</h1>
              <p className="mt-1 text-2xl font-extrabold text-brand-700 dark:text-brand-300">
                {formatVnd(checkout.purchase.amountVnd)}
              </p>
            </div>

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Ngân hàng</dt>
                <dd className="font-semibold text-gray-900 dark:text-slate-100">{checkout.bank.bankId}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Số tài khoản</dt>
                <dd className="font-semibold text-gray-900 dark:text-slate-100">{checkout.bank.accountNo}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Tên tài khoản</dt>
                <dd className="font-semibold text-gray-900 dark:text-slate-100">{checkout.bank.accountName}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Nội dung chuyển khoản</dt>
                <dd className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 font-mono font-bold text-gray-900 dark:bg-slate-800 dark:text-slate-100">
                  <span>{checkout.purchase.paymentCode}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-brand-700 dark:hover:bg-slate-700"
                    aria-label="Sao chép nội dung chuyển khoản"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
            </dl>

            {paid ? (
              <Alert type="success">Thanh toán đã hoàn tất. Đang mở khoá học...</Alert>
            ) : checkout.purchase.isExpired ? (
              <Alert type="error">
                Mã thanh toán đã quá 30 phút. Hãy tạo mã mới trước khi chuyển khoản để tránh nhầm đối soát.
              </Alert>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                <span>
                  Đang chờ SePay xác nhận chuyển khoản. Mã có hiệu lực đến{' '}
                  <strong>{formatDate(checkout.purchase.pendingExpiresAt)}</strong>.
                </span>
              </div>
            )}

            {!paid && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={checking}
                  onClick={() => void refreshStatus({ manual: true })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-950/40"
                >
                  <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
                </button>
                <button
                  type="button"
                  disabled={renewing}
                  onClick={() => void handleRenewCheckout()}
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {renewing ? 'Đang tạo mã...' : checkout.purchase.isExpired ? 'Tạo mã mới' : 'Làm mới mã QR'}
                </button>
                {checkout.demoPaymentEnabled && (
                  <button
                    type="button"
                    disabled={demoConfirming}
                    onClick={() => void handleDemoConfirm()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    <TestTube2 className="h-4 w-4" />
                    {demoConfirming ? 'Đang mô phỏng...' : 'Xác nhận thanh toán demo'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
