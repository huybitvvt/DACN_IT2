import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Loader2, QrCode } from 'lucide-react';
import { createCourseCheckout, getCourseCheckoutStatus, type CourseCheckout } from '@/lib/paymentApi';
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
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
    if (!slug || !checkout || paid) return;

    let stopped = false;
    const pollStatus = async () => {
      try {
        const purchase = await getCourseCheckoutStatus(slug);
        if (stopped) return;

        setCheckout((current) => (current ? { ...current, purchase } : current));
        if (purchase.status === 'PAID') {
          setPaid(true);
          window.setTimeout(() => navigate(`/courses/${slug}`, { replace: true }), 1600);
        }
      } catch (err) {
        if (!stopped) setError(getErrorMessage(err, 'Không kiểm tra được trạng thái thanh toán.'));
      }
    };

    void pollStatus();
    const intervalId = window.setInterval(pollStatus, 4000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [checkout?.purchase.id, navigate, paid, slug]);

  async function handleCopy() {
    if (!checkout) return;
    await navigator.clipboard.writeText(checkout.purchase.paymentCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
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
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                <span>Đang chờ SePay xác nhận chuyển khoản. Vui lòng giữ nguyên nội dung thanh toán.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
