import { useEffect, useState } from 'react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/api';
import {
  adminListPurchases,
  adminMarkPurchasePaid,
  type AdminPurchase,
} from '@/lib/adminApi';
import { formatVnd } from '@/lib/format';
import type { PurchaseStatus } from '@/lib/paymentApi';

function formatDate(value: string | null) {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleString('vi-VN');
}

function statusBadge(status: PurchaseStatus) {
  return status === 'PAID'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
}

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState<AdminPurchase[]>([]);
  const [status, setStatus] = useState<PurchaseStatus | ''>('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');

  async function loadPurchases() {
    setLoading(true);
    setError('');
    try {
      const nextPurchases = await adminListPurchases({ status, q });
      setPurchases(nextPurchases);
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được danh sách đơn mua.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadPurchases();
  }

  async function handleMarkPaid(purchase: AdminPurchase) {
    const ok = window.confirm(
      `Đánh dấu đơn ${purchase.paymentCode} là đã thanh toán? Chỉ làm khi bạn đã đối soát ngân hàng.`,
    );
    if (!ok) return;

    setActionId(purchase.id);
    setError('');
    try {
      await adminMarkPurchasePaid(purchase.id);
      await loadPurchases();
    } catch (err) {
      setError(getErrorMessage(err, 'Không cập nhật được đơn mua.'));
    } finally {
      setActionId('');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Đối soát các đơn chờ thanh toán và xử lý thủ công khi webhook lỗi.
          </p>
        </div>
        <form onSubmit={(event) => void handleSearch(event)} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Email, mã CL, tên khoá..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-72"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as PurchaseStatus | '')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Tìm
          </button>
        </form>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
          <table className="w-full bg-white text-sm dark:bg-slate-900">
            <thead className="bg-gray-50 text-left text-gray-600 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="p-3 font-semibold">Người mua</th>
                <th className="p-3 font-semibold">Khoá học</th>
                <th className="p-3 font-semibold">Mã</th>
                <th className="p-3 font-semibold">Số tiền</th>
                <th className="p-3 font-semibold">Trạng thái</th>
                <th className="p-3 font-semibold">Ngày tạo</th>
                <th className="p-3 font-semibold">Ngày thanh toán</th>
                <th className="p-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 dark:text-slate-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-t border-gray-100 dark:border-slate-800">
                  <td className="p-3">
                    <div className="font-semibold">{purchase.user.displayName}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{purchase.user.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{purchase.course.title}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{purchase.course.slug}</div>
                  </td>
                  <td className="p-3 font-mono font-semibold">{purchase.paymentCode}</td>
                  <td className="p-3 font-semibold">{formatVnd(purchase.amountVnd)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(purchase.status)}`}>
                      {purchase.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 dark:text-slate-400">{formatDate(purchase.createdAt)}</td>
                  <td className="p-3 text-gray-500 dark:text-slate-400">{formatDate(purchase.paidAt)}</td>
                  <td className="p-3">
                    {purchase.status === 'PENDING' ? (
                      <button
                        type="button"
                        disabled={actionId === purchase.id}
                        onClick={() => void handleMarkPaid(purchase)}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionId === purchase.id ? 'Đang xử lý...' : 'Đánh dấu PAID'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500 dark:text-slate-400">
                    Không có đơn mua phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
