import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Play,
  CheckCircle2,
  Bot,
  TrendingUp,
  Terminal,
  Database,
  Cpu,
  Braces,
  Zap,
  GraduationCap,
} from 'lucide-react';
import { fetchCourses } from '@/lib/contentApi';
import type { Course, ProgrammingLanguage } from '@/types';

/**
 * Cấu hình tĩnh cho 4 ngôn ngữ. Số bài học sẽ được làm giàu bằng dữ liệu thật
 * từ API nếu tải được; nếu không sẽ dùng giá trị ước lượng làm dự phòng.
 */
type LangConfig = {
  slug: string;
  language: ProgrammingLanguage;
  name: string;
  tagline: string;
  desc: string;
  icon: typeof Terminal;
  gradient: string; // gradient cho khối icon
  glow: string; // box-shadow phát sáng khi hover
  ring: string; // viền sáng khi hover
  badge?: { label: string; tone: string };
  fallbackLessons: number;
};

const LANGUAGES: LangConfig[] = [
  {
    slug: 'python',
    language: 'PYTHON',
    name: 'Python',
    tagline: 'Dễ học · Đa năng',
    desc: 'Ngôn ngữ phổ biến nhất cho AI, web và phân tích dữ liệu.',
    icon: Terminal,
    gradient: 'from-sky-400 via-cyan-400 to-blue-500',
    glow: 'group-hover:shadow-glowPython',
    ring: 'group-hover:border-sky-400/60',
    badge: { label: 'Phổ biến', tone: 'bg-sky-500/15 text-sky-300 ring-sky-400/30' },
    fallbackLessons: 24,
  },
  {
    slug: 'sql',
    language: 'SQL',
    name: 'SQL',
    tagline: 'Dữ liệu · Truy vấn',
    desc: 'Truy vấn, lọc và quản trị cơ sở dữ liệu quan hệ thành thạo.',
    icon: Database,
    gradient: 'from-amber-300 via-orange-400 to-rose-500',
    glow: 'group-hover:shadow-glowSql',
    ring: 'group-hover:border-amber-400/60',
    badge: { label: 'Thực chiến', tone: 'bg-amber-500/15 text-amber-300 ring-amber-400/30' },
    fallbackLessons: 18,
  },
  {
    slug: 'c',
    language: 'C',
    name: 'C',
    tagline: 'Nền tảng · Hệ thống',
    desc: 'Hiểu sâu bộ nhớ, con trỏ và cách máy tính vận hành.',
    icon: Cpu,
    gradient: 'from-blue-400 via-indigo-400 to-blue-600',
    glow: 'group-hover:shadow-glowC',
    ring: 'group-hover:border-blue-400/60',
    fallbackLessons: 20,
  },
  {
    slug: 'cpp',
    language: 'CPP',
    name: 'C++',
    tagline: 'Hiệu năng · OOP',
    desc: 'Lập trình hướng đối tượng và tối ưu hiệu năng cao.',
    icon: Braces,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    glow: 'group-hover:shadow-glowCpp',
    ring: 'group-hover:border-violet-400/60',
    badge: { label: 'Mới', tone: 'bg-violet-500/15 text-violet-300 ring-violet-400/30' },
    fallbackLessons: 16,
  },
];

const FEATURES = [
  {
    icon: Play,
    title: 'Chạy code ngay',
    desc: 'Thử code trực tiếp trên trình duyệt, không cần cài đặt môi trường.',
    accent: 'text-sky-500 bg-sky-500/10',
  },
  {
    icon: CheckCircle2,
    title: 'Chấm bài tự động',
    desc: 'Nộp bài và nhận kết quả tức thì qua bộ test case chi tiết.',
    accent: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    icon: Bot,
    title: 'Trợ lý AI 24/7',
    desc: 'Hỏi đáp và giải thích lỗi code bằng tiếng Việt bất cứ lúc nào.',
    accent: 'text-violet-500 bg-violet-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Theo dõi tiến độ',
    desc: 'Lộ trình rõ ràng, huy hiệu và chuỗi ngày học tạo động lực.',
    accent: 'text-amber-500 bg-amber-500/10',
  },
];

/** Dòng code mô phỏng trong "editor" của hero. */
const CODE_LINES = [
  { t: '# Học bằng cách thực hành', c: 'text-slate-500' },
  { t: 'def chao(ten):', c: 'text-violet-300' },
  { t: '    return f"Xin chào, {ten}!"', c: 'text-sky-200' },
  { t: '', c: '' },
  { t: 'print(chao("CodeLearn"))', c: 'text-emerald-300' },
];

export default function HomePage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Làm giàu số liệu bằng dữ liệu thật, lỗi thì im lặng dùng dự phòng.
  useEffect(() => {
    let alive = true;
    fetchCourses()
      .then((courses: Course[]) => {
        if (!alive) return;
        const map: Record<string, number> = {};
        for (const c of courses) map[c.slug] = (map[c.slug] ?? 0) + 1;
        setCounts(map);
      })
      .catch(() => {
        /* dùng fallbackLessons */
      });
    return () => {
      alive = false;
    };
  }, []);

  const totalLessons = useMemo(
    () => LANGUAGES.reduce((sum, l) => sum + (counts[l.slug] || l.fallbackLessons), 0),
    [counts],
  );

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* ============================ HERO ============================ */}
      <section className="relative -mx-4 overflow-hidden rounded-b-[2.5rem] bg-slate-950 px-4 pb-20 pt-16 text-white sm:pt-20">
        {/* Mesh gradient nền động */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] animate-mesh-shift rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute right-0 top-10 h-[24rem] w-[24rem] animate-mesh-shift rounded-full bg-sky-500/20 blur-3xl [animation-delay:-6s]" />
          <div className="absolute bottom-[-6rem] left-1/3 h-[26rem] w-[26rem] animate-mesh-shift rounded-full bg-violet-500/20 blur-3xl [animation-delay:-12s]" />
          {/* Lưới mờ tạo chiều sâu */}
          <div className="absolute inset-0 bg-grid-faint [background-size:40px_40px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          {/* Cột nội dung */}
          <div className="animate-fade-in-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-brand-100 backdrop-blur">
              <Sparkles className="h-4 w-4 text-accent-500" />
              Nền tảng học lập trình tương tác
            </span>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Học lập trình bằng cách{' '}
              <span className="bg-gradient-to-r from-brand-300 via-emerald-300 to-accent-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
                thực hành
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-300 lg:mx-0">
              Đọc bài học, chạy code ngay trên trình duyệt, làm bài tập được chấm tự động và hỏi
              trợ lý AI khi gặp khó khăn. Tất cả hoàn toàn miễn phí.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {/* CTA chính: hiệu ứng "magnetic" + glow */}
              <Link
                to="/courses"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-accent-500 px-7 py-3.5 font-bold text-ink-900 shadow-softLg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glowBrand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                Bắt đầu học ngay
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* CTA phụ */}
              <Link
                to="/courses/python"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
              >
                <Play className="h-4 w-4 fill-current" />
                Thử khoá Python
              </Link>
            </div>

            {/* Số liệu nhanh */}
            <dl className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
              {[
                { v: '4', l: 'Ngôn ngữ' },
                { v: `${totalLessons}+`, l: 'Bài học' },
                { v: '100%', l: 'Miễn phí' },
              ].map((s) => (
                <div key={s.l} className="text-center lg:text-left">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-display text-2xl font-extrabold text-white">{s.v}</dd>
                  <dd className="text-sm text-slate-400">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Cột mock-up editor */}
          <div className="relative animate-fade-in-up [animation-delay:120ms] lg:pl-6">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-500/20 via-transparent to-sky-500/20 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-softLg backdrop-blur-xl">
              {/* Thanh tiêu đề cửa sổ */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-slate-950/60 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-400/90" />
                <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
                <span className="ml-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Terminal className="h-3.5 w-3.5" />
                  main.py
                </span>
                <span className="ml-auto flex items-center gap-1 rounded-md bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold text-brand-300 ring-1 ring-brand-400/30">
                  <Zap className="h-3 w-3" />
                  Live
                </span>
              </div>

              {/* Khu vực code */}
              <div className="space-y-1.5 px-5 py-5 font-mono text-sm leading-relaxed">
                {CODE_LINES.map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-4 select-none text-right text-slate-600">{i + 1}</span>
                    <code className={line.c || 'text-slate-500'}>
                      {line.t || '\u00A0'}
                      {i === CODE_LINES.length - 1 && (
                        <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink bg-brand-400" />
                      )}
                    </code>
                  </div>
                ))}
              </div>

              {/* Console output */}
              <div className="border-t border-white/10 bg-black/40 px-5 py-4 font-mono text-sm">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                  <Play className="h-3 w-3 fill-current text-brand-400" />
                  Output
                </div>
                <p className="text-emerald-300">Xin chào, CodeLearn!</p>
              </div>
            </div>

            {/* Thẻ nổi: chấm bài */}
            <div className="absolute -bottom-5 -left-5 hidden animate-float items-center gap-2 rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-softLg backdrop-blur sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Tất cả test passed</p>
                <p className="text-xs text-slate-400">Chấm tự động · 0.2s</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CHỌN NGÔN NGỮ ===================== */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
            <GraduationCap className="h-4 w-4" />
            Lộ trình học
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Chọn ngôn ngữ để bắt đầu
          </h2>
          <p className="mt-3 text-gray-600 dark:text-slate-400">
            Mỗi khoá học được thiết kế từ cơ bản đến nâng cao, kèm bài tập thực hành ngay.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LANGUAGES.map((lang, i) => {
            const Icon = lang.icon;
            const lessons = counts[lang.slug] || lang.fallbackLessons;
            return (
              <Link
                key={lang.slug}
                to={`/courses/${lang.slug}`}
                style={{ animationDelay: `${i * 80}ms` }}
                className={`group relative flex animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 ${lang.glow} ${lang.ring} dark:border-slate-800 dark:bg-slate-900/60`}
              >
                {/* Badge micro-copy */}
                {lang.badge && (
                  <span
                    className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${lang.badge.tone}`}
                  >
                    {lang.badge.label}
                  </span>
                )}

                {/* Icon gradient */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${lang.gradient} text-white shadow-soft transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.2} />
                </div>

                <h3 className="mt-5 font-display text-xl font-bold text-gray-900 dark:text-white">
                  {lang.name}
                </h3>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  {lang.tagline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {lang.desc}
                </p>

                {/* Chân thẻ: số bài học + CTA */}
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
                    <Play className="h-3.5 w-3.5 fill-current text-brand-500" />
                    {lessons} bài học
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-brand-400">
                    Học ngay
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===================== TÍNH NĂNG ===================== */}
      <section className="-mx-4 rounded-[2.5rem] bg-gray-50 px-4 py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Vì sao chọn CodeLearn?
          </h2>
          <p className="mt-3 text-gray-600 dark:text-slate-400">
            Mọi công cụ bạn cần để học hiệu quả, gọn trong một nền tảng.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{ animationDelay: `${i * 80}ms` }}
                className="group animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.accent} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== CTA CUỐI ===================== */}
      <section className="relative -mx-4 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 px-6 py-16 text-center text-white">
        <div
          className="absolute inset-0 opacity-10"
          aria-hidden="true"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sẵn sàng viết dòng code đầu tiên?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-50/90">
            Tham gia CodeLearn ngay hôm nay, học theo nhịp độ của bạn và xây nền tảng vững chắc.
          </p>
          <Link
            to="/register"
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-brand-700 shadow-softLg transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-500 hover:text-ink-900"
          >
            Tạo tài khoản miễn phí
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
