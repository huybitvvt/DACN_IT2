import { Link } from 'react-router-dom';

const languages = [
  { slug: 'sql', name: 'SQL', desc: 'Truy vấn và quản lý cơ sở dữ liệu.' },
  { slug: 'c', name: 'C', desc: 'Ngôn ngữ nền tảng, sát phần cứng.' },
  { slug: 'cpp', name: 'C++', desc: 'Lập trình hướng đối tượng và hiệu năng cao.' },
  { slug: 'python', name: 'Python', desc: 'Dễ học, đa năng, phổ biến.' },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold text-gray-900">Học lập trình bằng cách thực hành</h1>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Đọc bài học, chạy code ngay trên trình duyệt, làm bài tập được chấm tự động và hỏi trợ
          lý AI khi gặp khó khăn.
        </p>
        <Link
          to="/courses"
          className="inline-block mt-6 px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700"
        >
          Bắt đầu học
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Các khoá học</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {languages.map((lang) => (
            <Link
              key={lang.slug}
              to={`/courses/${lang.slug}`}
              className="block p-5 bg-white rounded-lg border border-gray-200 hover:border-brand-400 hover:shadow-sm transition"
            >
              <h3 className="font-bold text-brand-700">{lang.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{lang.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
