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
  BookOpen,
  Trophy,
  Star,
  Quote,
} from 'lucide-react';
import { fetchCourses } from '@/lib/contentApi';
import { useScrollReveal } from '@/lib/useScrollReveal';
import SpotlightCard from '@/components/ui/SpotlightCard';
import type { Course, ProgrammingLanguage } from '@/types';

/* ---------------------------------------------------------------- *
 * Cấu hình dữ liệu tĩnh
 * ---------------------------------------------------------------- */
type LangConfig = {
  slug: string;
  language: ProgrammingLanguage;
  name: string;
  tagline: string;
  desc: string;
  icon: typeof Terminal;
  gradient: string;
  glow: string;
  shadow: string;
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
    shadow: 'shadow-sky-500/20',
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
    shadow: 'shadow-amber-500/20',
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
    shadow: 'shadow-blue-500/20',
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
    shadow: 'shadow-violet-500/20',
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

const STEPS = [
  {
    icon: BookOpen,
    title: 'Đọc bài học',
    desc: 'Nội dung ngắn gọn, ví dụ trực quan, kèm code mẫu chạy được ngay.',
  },
  {
    icon: Terminal,
    title: 'Thực hành code',
    desc: 'Viết và chạy code trên trình duyệt, thử nghiệm không giới hạn.',
  },
  {
    icon: CheckCircle2,
    title: 'Nộp & được chấm',
    desc: 'Hệ thống chấm tự động qua test case, phản hồi tức thì.',
  },
  {
    icon: Trophy,
    title: 'Nhận chứng chỉ',
    desc: 'Hoàn thành khoá học, nhận huy hiệu và chứng chỉ của bạn.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Minh Anh',
    role: 'Sinh viên CNTT',
    text: 'Chạy code ngay trên web giúp mình học nhanh hơn hẳn. Trợ lý AI giải thích lỗi cực dễ hiểu.',
    initials: 'MA',
    tone: 'from-sky-400 to-blue-500',
  },
  {
    name: 'Quốc Huy',
    role: 'Người mới bắt đầu',
    text: 'Lộ trình rõ ràng từng bước, chuỗi ngày học làm mình muốn quay lại mỗi ngày.',
    initials: 'QH',
    tone: 'from-emerald-400 to-brand-600',
  },
  {
    name: 'Thuỳ Dương',
    role: 'Tự học lập trình',
    text: 'Bài tập chấm tự động và quiz sau mỗi bài giúp mình biết chính xác mình hổng chỗ nào.',
    initials: 'TD',
    tone: 'from-violet-400 to-fuchsia-500',
  },
];

const MARQUEE = ['Python', 'SQL', 'C', 'C++', 'Pyodide', 'Judge0', 'AI Tutor', 'Quiz', 'Chứng chỉ'];

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
  const revealRef = useScrollReveal<HTMLDivElement>();

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
    <div ref={revealRef} className="space-y-24 sm:space-y-32">
      {/* ============================ HERO ============================ */}
      <section className="relative -mx-4 grain overflow-hidden rounded-b-[2.5rem] bg-slate-950 px-4 pb-24 pt-16 text-white sm:pt-24">
        {/* Aurora xoay phía sau */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 animate-aurora-spin rounded-full bg-aurora opacity-[0.16] blur-[120px]" />
          <div className="absolute -left-20 top-0 h-[26rem] w-[26rem] animate-mesh-shift rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute right-0 top-20 h-[22rem] w-[22rem] animate-mesh-shift rounded-full bg-sky-500/20 blur-3xl [animation-delay:-8s]" />
          {/* Lưới chấm mờ dần ở mép */}
          <div className="absolute inset-0 bg-dot-grid [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Cột nội dung */}
          <div className="text-center lg:text-left">
            <span className="reveal inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-brand-100 shadow-glass backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              Nền tảng học lập trình tương tác
            </span>

            <h1
              className="reveal mt-6 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.2rem]"
              data-reveal-delay="80"
            >
              Học lập trình bằng cách{' '}
              <span className="text-gradient bg-gradient-to-r from-brand-300 via-emerald-300 to-accent-500 bg-[length:200%_auto] animate-gradient-x">
                thực hành
              </span>
            </h1>

            <p
              className="reveal mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300 lg:mx-0"
              data-reveal-delay="160"
            >
              Đọc bài học, chạy code ngay trên trình duyệt, làm bài tập được chấm tự động và hỏi
              trợ lý AI khi gặp khó khăn. Mua khoá học với giá minh bạch và mở khoá tự động sau thanh toán.
            </p>

            <div
              className="reveal mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
              data-reveal-delay="240"
            >
              <Link
                to="/courses"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-accent-500 px-7 py-3.5 font-bold text-ink-900 shadow-floaty transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-glowBrand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                Bắt đầu học ngay
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                to="/courses/python"
                className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-brand-500/30">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                Thử khoá Python
              </Link>
            </div>

            {/* Số liệu nhanh */}
            <dl
              className="reveal mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 lg:justify-start"
              data-reveal-delay="320"
            >
              {[
                { v: '4', l: 'Ngôn ngữ' },
                { v: `${totalLessons}+`, l: 'Bài học' },
                { v: '2.000đ', l: 'Mỗi khoá' },
              ].map((s) => (
                <div key={s.l} className="text-center lg:text-left">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-display text-3xl font-extrabold text-white">{s.v}</dd>
                  <dd className="text-sm text-slate-400">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Cột mock-up editor */}
          <div className="reveal lg:pl-4" data-reveal-delay="200">
            <SpotlightCard tilt tiltMax={5} className="relative">
              <div
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-brand-500/25 via-transparent to-sky-500/25 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-floaty backdrop-blur-xl">
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
              <div className="absolute -bottom-5 -left-5 hidden animate-float items-center gap-2 rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-floaty backdrop-blur sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Tất cả test passed</p>
                  <p className="text-xs text-slate-400">Chấm tự động · 0.2s</p>
                </div>
              </div>

              {/* Thẻ nổi: streak */}
              <div className="absolute -right-4 top-8 hidden animate-float items-center gap-2 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 shadow-floaty backdrop-blur [animation-delay:-2s] md:flex">
                <span className="text-lg">🔥</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">7 ngày</p>
                  <p className="text-[10px] text-slate-400">chuỗi học</p>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Dải marquee công nghệ */}
        <div className="reveal relative mx-auto mt-16 max-w-6xl" data-reveal-delay="200">
          <div className="flex items-center gap-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex shrink-0 animate-marquee items-center gap-3">
              {[...MARQUEE, ...MARQUEE].map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300"
                >
                  <Star className="h-3 w-3 text-accent-500" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CHỌN NGÔN NGỮ ===================== */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <span className="reveal inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
            <GraduationCap className="h-4 w-4" />
            Lộ trình học
          </span>
          <h2
            className="reveal mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            data-reveal-delay="80"
          >
            Chọn ngôn ngữ để bắt đầu
          </h2>
          <p className="reveal mt-3 text-gray-600 dark:text-slate-400" data-reveal-delay="140">
            Mỗi khoá học được thiết kế từ cơ bản đến nâng cao, kèm bài tập thực hành ngay.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LANGUAGES.map((lang, i) => {
            const Icon = lang.icon;
            const lessons = counts[lang.slug] || lang.fallbackLessons;
            return (
              <div key={lang.slug} className="reveal" data-reveal-delay={`${i * 90}`}>
                <SpotlightCard tilt tiltMax={7} className="h-full">
                  <Link
                    to={`/courses/${lang.slug}`}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-1 ${lang.glow} dark:border-slate-800 dark:bg-slate-900/60`}
                  >
                    {/* Badge micro-copy */}
                    {lang.badge && (
                      <span
                        className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${lang.badge.tone}`}
                      >
                        {lang.badge.label}
                      </span>
                    )}

                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${lang.gradient} text-white shadow-lg ${lang.shadow} transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-6`}
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
                </SpotlightCard>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== CÁCH HOẠT ĐỘNG ===================== */}
      <section className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="reveal inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
            <Sparkles className="h-4 w-4" />
            Quy trình
          </span>
          <h2
            className="reveal mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            data-reveal-delay="80"
          >
            Học hiệu quả trong 4 bước
          </h2>
        </div>

        <div className="relative mt-14">
          {/* Đường nối ngang trên desktop */}
          <div
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-slate-700 lg:block"
            aria-hidden="true"
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="reveal relative text-center"
                  data-reveal-delay={`${i * 110}`}
                >
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-brand-600 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-brand-400">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-glowBrand">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== TÍNH NĂNG ===================== */}
      <section className="relative -mx-4 overflow-hidden rounded-[2.5rem] bg-gray-50 px-4 py-16 dark:bg-slate-900/50">
        <div
          className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60 [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="reveal font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Vì sao chọn CodeLearn?
          </h2>
          <p className="reveal mt-3 text-gray-600 dark:text-slate-400" data-reveal-delay="100">
            Mọi công cụ bạn cần để học hiệu quả, gọn trong một nền tảng.
          </p>
        </div>

        <div className="relative mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="reveal" data-reveal-delay={`${i * 90}`}>
                <SpotlightCard className="h-full">
                  <div className="border-gradient group h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-cardHover dark:border-slate-800 dark:bg-slate-900/60">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.accent} transition-transform duration-300 ease-spring group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                      {f.desc}
                    </p>
                  </div>
                </SpotlightCard>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== ĐÁNH GIÁ ===================== */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <span className="reveal inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
            <Star className="h-4 w-4 fill-current" />
            Người học nói gì
          </span>
          <h2
            className="reveal mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            data-reveal-delay="80"
          >
            Được tin dùng bởi người mới bắt đầu
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className="reveal" data-reveal-delay={`${i * 110}`}>
              <SpotlightCard className="h-full">
                <figure className="relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-softLg dark:border-slate-800 dark:bg-slate-900/60">
                  <Quote className="h-8 w-8 text-brand-500/20" />
                  <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                    "{t.text}"
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.tone} text-sm font-bold text-white`}
                    >
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              </SpotlightCard>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CTA CUỐI ===================== */}
      <section className="reveal relative -mx-4 grain overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-20 text-center text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 animate-aurora-spin rounded-full bg-aurora opacity-20 blur-[100px]" />
          <div className="absolute inset-0 bg-dot-grid [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-brand-100 backdrop-blur">
            <Sparkles className="h-4 w-4 text-accent-500" />
            Đăng ký miễn phí · Thanh toán bằng VietQR
          </span>
          <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Sẵn sàng viết dòng code{' '}
            <span className="text-gradient bg-gradient-to-r from-brand-300 to-accent-500">
              đầu tiên?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-300">
            Tham gia CodeLearn ngay hôm nay, học theo nhịp độ của bạn và xây nền tảng vững chắc.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-accent-500 px-8 py-3.5 font-bold text-ink-900 shadow-floaty transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-glowBrand"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Tạo tài khoản miễn phí
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-white/10"
            >
              Xem các khoá học
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
