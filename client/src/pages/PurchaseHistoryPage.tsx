import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ReceiptText } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import LanguageBadge from '@/components/LanguageBadge';
import { getErrorMessage } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { fetchPurchaseHistory, type PurchaseHistoryItem } from '@/lib/paymentApi';

function formatDate(value: string | null) {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleString('vi-VN');
}

function StatusBadge({ purchase }: { purchase: PurchaseHistoryItem }) {
  if (purchase.status === 'PAID') {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        Đã thanh toán
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
      {purchase.isExpired ? 'Cần tạo mã mới' : 'Chờ thanh toán'}
    </span>
  );
}

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchaseHistory()
      .then(setPurchases)
      .catch((err) => setError(getErrorMessage(err, 'Không tải được lịch sử mua khoá học.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ReceiptText className="h-6 w-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử mua khoá học</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Theo dõi thanh toán và truy cập khoá học của bạn.</p>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Bạn chưa có giao dịch mua khoá học nào.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
          <table className="w-full bg-white text-sm dark:bg-slate-900">
            <thead className="bg-gray-50 text-left text-gray-600 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="p-3 font-semibold">Khoá học</th>
                <th className="p-3 font-semibold">Mã thanh toán</th>
                <th className="p-3 font-semibold">Số tiền</th>
                <th className="p-3 font-semibold">Trạng thái</th>
                <th className="p-3 font-semibold">Ngày thanh toán</th>
                <th className="p-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 dark:text-slate-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-t border-gray-100 dark:border-slate-800">
                  <td className="p-3">
                    <div className="space-y-1">
                      <Link to={`/courses/${purchase.course.slug}`} className="font-semibold hover:text-brand-700">
                        {purchase.course.title}
                      </Link>
                      <div>
                        <LanguageBadge language={purchase.course.language} />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-semibold">{purchase.paymentCode}</td>
                  <td className="p-3 font-semibold">{formatVnd(purchase.amountVnd)}</td>
                  <td className="p-3">
                    <StatusBadge purchase={purchase} />
                    {purchase.status === 'PENDING' && purchase.pendingExpiresAt && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Hết hạn: {formatDate(purchase.pendingExpiresAt)}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-gray-500 dark:text-slate-400">{formatDate(purchase.paidAt)}</td>
                  <td className="p-3">
                    <Link
                      to={
                        purchase.status === 'PAID'
                          ? `/courses/${purchase.course.slug}`
                          : `/courses/${purchase.course.slug}/checkout`
                      }
                      className="inline-flex rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      {purchase.status === 'PAID' ? 'Vào học' : 'Thanh toán'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
