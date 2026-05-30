import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-900">Không tìm thấy trang</h1>
      <p className="mt-2 text-gray-500">Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
      <Link to="/" className="inline-block mt-6 text-brand-700 hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
