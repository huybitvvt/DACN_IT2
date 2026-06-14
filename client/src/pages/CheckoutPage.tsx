import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, QrCode } from 'lucide-react';
import { createCourseCheckout, confirmCourseDemo, type CourseCheckout } from '@/lib/paymentApi';
import { getErrorMessage } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState<CourseCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    createCourseCheckout(slug)
      .then(setCheckout)
      .catch((err) => setError(getErrorMessage(err, 'Không tạo được mã thanh toán.')))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleCopy() {
    if (!checkout) return;
    await navigator.clipboard.writeText(checkout.purchase.paymentCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleDemoConfirm() {
    if (!slug) return;
    setSubmitting(true);
    setError('');
    try {
      await confirmCourseDemo(slug);
      navigate(`/courses/${slug}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Không xác nhận được thanh toán.'));
    } finally {
      setSubmitting(false);
    }
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

            <Alert type="info">
              Bản demo chưa nối webhook ngân hàng. Sau khi quét mã và chuyển khoản, dùng nút xác nhận demo để mở khoá học.
            </Alert>

            <button
              type="button"
              disabled={submitting}
              onClick={handleDemoConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 py-2.5 font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? 'Đang xác nhận...' : 'Xác nhận demo và mở khoá'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
