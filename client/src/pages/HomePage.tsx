import { Link } from 'react-router-dom';

const languages = [
  { slug: 'python', name: 'Python', icon: '🐍', desc: 'Dễ học, đa năng, phổ biến nhất hiện nay.', color: 'from-green-400 to-emerald-600' },
  { slug: 'sql', name: 'SQL', icon: '🗄️', desc: 'Truy vấn và quản lý cơ sở dữ liệu.', color: 'from-amber-400 to-orange-500' },
  { slug: 'c', name: 'C', icon: '⚙️', desc: 'Ngôn ngữ nền tảng, sát phần cứng.', color: 'from-sky-400 to-blue-600' },
  { slug: 'cpp', name: 'C++', icon: '🚀', desc: 'Hướng đối tượng và hiệu năng cao.', color: 'from-indigo-400 to-violet-600' },
];

const features = [
  { icon: '▶️', title: 'Chạy code ngay', desc: 'Thử code trực tiếp trên trình duyệt, không cần cài đặt môi trường.' },
  { icon: '✅', title: 'Chấm bài tự động', desc: 'Nộp bài và nhận kết quả ngay với bộ test case.' },
  { icon: '🤖', title: 'Trợ lý AI', desc: 'Hỏi đáp và giải thích lỗi code bằng tiếng Việt 24/7.' },
  { icon: '📈', title: 'Theo dõi tiến độ', desc: 'Lộ trình rõ ràng, huy hiệu và chuỗi ngày học tạo động lực.' },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative -mx-4 px-4 py-20 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 text-white overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-3xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Học lập trình bằng cách <span className="text-accent-500">thực hành</span>
          </h1>
          <p className="mt-4 text-lg text-brand-50/90 max-w-2xl mx-auto">
            Đọc bài học, chạy code ngay trên trình duyệt, làm bài tập được chấm tự động và hỏi trợ lý
            AI khi gặp khó khăn. Tất cả miễn phí.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/courses"
              className="px-7 py-3 rounded-lg bg-accent-500 text-ink-900 font-bold hover:bg-accent-600 transition-transform hover:scale-105 shadow-lg"
            >
              Bắt đầu học ngay
            </Link>
            <Link
              to="/courses/python"
              className="px-7 py-3 rounded-lg bg-white/15 backdrop-blur text-white font-semibold hover:bg-white/25 transition"
            >
              Thử khoá Python →
            </Link>
          </div>
        </div>
      </section>

      {/* Khoá học */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Chọn ngôn ngữ để bắt đầu</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {languages.map((lang, i) => (
            <Link
              key={lang.slug}
              to={`/courses/${lang.slug}`}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group block rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-card hover:shadow-cardHover hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
            >
              <div className={`h-24 bg-gradient-to-br ${lang.color} flex items-center justify-center text-4xl`}>
                <span className="group-hover:scale-125 transition-transform duration-300">{lang.icon}</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900">{lang.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{lang.desc}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                  Học ngay →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tính năng */}
      <section className="bg-gray-50 -mx-4 px-4 py-12 rounded-3xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Vì sao chọn CodeLearn?</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="text-center p-5">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
