import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCertificate, type Certificate } from '@/lib/certificateApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function CertificatePage() {
  const { slug } = useParams<{ slug: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetchCertificate(slug)
      .then(setCert)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (error)
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Alert type="error">{error}</Alert>
        <Link to="/dashboard" className="text-brand-600 hover:underline">
          ← Về trang tiến độ
        </Link>
      </div>
    );
  if (!cert) return null;

  const date = new Date(cert.issuedAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-center print:hidden">
        <Link to="/dashboard" className="text-brand-600 hover:underline text-sm">
          ← Về trang tiến độ
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700"
        >
          🖨️ In / Lưu PDF
        </button>
      </div>

      {/* Khung chứng chỉ */}
      <div
        id="certificate"
        className="relative bg-white text-gray-900 border-[6px] border-brand-500 rounded-lg p-10 text-center shadow-lg"
      >
        <div className="absolute inset-3 border border-brand-300 rounded pointer-events-none" />
        <p className="text-sm uppercase tracking-[0.3em] text-brand-600 font-semibold">
          Chứng chỉ hoàn thành
        </p>
        <h1 className="mt-4 text-3xl font-extrabold">CodeLearn</h1>
        <p className="mt-6 text-gray-600">Chứng nhận</p>
        <p className="mt-2 text-2xl font-bold text-brand-700">{cert.learnerName}</p>
        <p className="mt-4 text-gray-600">đã hoàn thành xuất sắc khoá học</p>
        <p className="mt-1 text-xl font-semibold">{cert.courseTitle}</p>

        <div className="mt-8 flex items-center justify-between text-sm text-gray-500 px-4">
          <div>
            <p className="font-semibold text-gray-700">Ngày cấp</p>
            <p>{date}</p>
          </div>
          <div className="text-4xl">🏆</div>
          <div>
            <p className="font-semibold text-gray-700">Mã chứng chỉ</p>
            <p>{cert.code}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
