import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Gift,
  GraduationCap,
  ListChecks,
  Medal,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ProgressBar from '@/components/ProgressBar';
import { getErrorMessage } from '@/lib/api';
import {
  fetchRetentionPlan,
  type MissionType,
  type RetentionPlan,
  type RiskLevel,
} from '@/lib/retentionApi';

const riskTone: Record<RiskLevel, string> = {
  NOT_STARTED: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100',
  ON_TRACK: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  WATCH: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  AT_RISK: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
};

const missionIcon: Record<MissionType, ElementType> = {
  COURSE: GraduationCap,
  LESSON: BookOpenCheck,
  EXERCISE: ListChecks,
  QUIZ: CheckCircle2,
  CONTEST: Trophy,
};

function riskIcon(level: RiskLevel) {
  if (level === 'NOT_STARTED') return GraduationCap;
  if (level === 'ON_TRACK') return ShieldCheck;
  if (level === 'WATCH') return Gauge;
  return AlertTriangle;
}

function inactiveText(days: number) {
  if (days >= 90) return 'chưa có hoạt động';
  if (days === 0) return 'hôm nay';
  if (days === 1) return '1 ngày';
  return `${days} ngày`;
}

function progressText(current: number, target: number) {
  return `${Math.min(current, target)}/${target}`;
}

export default function RetentionPage() {
  const [plan, setPlan] = useState<RetentionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRetentionPlan()
      .then(setPlan)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!plan) return null;

  const RiskIcon = riskIcon(plan.riskLevel);
  const rescuePercent = Math.round((Math.min(plan.rescueOffer.current, plan.rescueOffer.target) / plan.rescueOffer.target) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Trạm giữ nhịp
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Kế hoạch chống bỏ học hôm nay
          </h1>
        </div>
        <Link
          to="/contests"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-200"
        >
          Mùa thi đang mở
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className={`rounded-xl border p-5 ${riskTone[plan.riskLevel]}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-slate-900/70">
              <RiskIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold">Điểm giữ nhịp</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-black">{plan.healthScore}</span>
                <span className="pb-1 text-sm font-semibold">/100</span>
              </div>
              <h2 className="mt-2 text-lg font-bold">{plan.riskLabel}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 opacity-90">{plan.riskMessage}</p>
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
            <Metric icon={Activity} label="Tiến độ" value={`${plan.metrics.overallPercent}%`} />
            <Metric icon={Flame} label="Streak" value={`${plan.metrics.streak} ngày`} />
            <Metric icon={Clock3} label="Lần học gần nhất" value={inactiveText(plan.metrics.daysInactive)} />
            <Metric icon={Medal} label="Huy hiệu" value={`${plan.metrics.badges}`} />
          </div>
        </div>
        {plan.scoreFormula.factors.length > 0 && (
          <details className="mt-4 rounded-lg bg-white/60 p-4 dark:bg-slate-900/50">
            <summary className="cursor-pointer text-sm font-bold">
              Vì sao hệ thống tính {plan.healthScore} điểm?
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {plan.scoreFormula.factors.map((factor) => (
                <div key={factor.key} className="rounded-lg bg-white/80 p-3 dark:bg-slate-950/60">
                  <p className="text-xs font-semibold opacity-75">{factor.label}</p>
                  <p className="mt-1 text-lg font-black">
                    {factor.score}/{factor.maxScore}
                  </p>
                  <p className="mt-1 text-xs leading-5 opacity-80">{factor.explanation}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {plan.scoreFormula.reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs opacity-70">Công thức: {plan.scoreFormula.version}</p>
          </details>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nhiệm vụ ưu tiên</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tính từ tiến độ, streak và mùa thi hiện tại.
              </p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
              {plan.missions.length} nhiệm vụ
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {plan.missions.length === 0 ? (
              <Alert type="info">Bạn đã hoàn thành toàn bộ nhiệm vụ hiện có.</Alert>
            ) : (
              plan.missions.map((mission) => {
                const Icon = missionIcon[mission.type];
                return (
                  <article
                    key={mission.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-700 sm:flex-row sm:items-center"
                  >
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{mission.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{mission.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                          +{mission.points} điểm
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
                          {mission.minutes} phút
                        </span>
                      </div>
                    </div>
                    <Link
                      to={mission.ctaHref}
                      className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      {mission.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-200">
                <Gift className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">{plan.rescueOffer.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {progressText(plan.rescueOffer.current, plan.rescueOffer.target)} nhiệm vụ
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {plan.rescueOffer.description}
            </p>
            <div className="mt-4">
              <ProgressBar percent={rescuePercent} />
            </div>
            {plan.intervention && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span>
                    {plan.intervention.source === 'ADMIN' ? 'Admin giao' : 'Hệ thống đề xuất'} ·{' '}
                    {plan.intervention.status}
                  </span>
                  <span>Hạn {new Date(plan.intervention.dueAt).toLocaleString('vi-VN')}</span>
                </div>
                {plan.intervention.missions.map((mission) => (
                  <Link
                    key={mission.id}
                    to={mission.ctaHref}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-700"
                  >
                    <span className={mission.completedAt ? 'line-through opacity-60' : 'font-semibold text-gray-800 dark:text-gray-200'}>
                      {mission.title}
                    </span>
                    <span className="flex-shrink-0 text-xs font-bold text-brand-600 dark:text-brand-300">
                      {mission.completedAt ? 'Đã xong' : `${mission.estimatedMinutes} phút`}
                    </span>
                  </Link>
                ))}
                {typeof plan.intervention.outcome?.scoreDelta === 'number' && (
                  <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                    Hiệu quả: {plan.intervention.outcome.scoreDelta >= 0 ? '+' : ''}
                    {plan.intervention.outcome.scoreDelta} điểm giữ nhịp
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
                <Award className="h-5 w-5" />
              </span>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Ưu đãi có thể săn</h2>
            </div>
            <div className="mt-4 space-y-3">
              {plan.incentives.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có mùa thưởng đang mở.</p>
              ) : (
                plan.incentives.map((item) => (
                  <Link
                    key={item.id}
                    to={item.ctaHref}
                    className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-700"
                  >
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.contestTitle}</p>
                    <h3 className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    <p className="mt-2 text-xs font-bold text-brand-600 dark:text-brand-300">
                      Hạng {item.rankFrom === item.rankTo ? item.rankFrom : `${item.rankFrom}-${item.rankTo}`}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>

      {plan.focusCourse && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Khoá cần tập trung</p>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">{plan.focusCourse.title}</h2>
              </div>
            </div>
            <Link
              to={`/roadmap/${plan.focusCourse.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-200"
            >
              Mở lộ trình
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4">
            <ProgressBar percent={plan.focusCourse.percent} />
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/75 p-3 shadow-sm dark:bg-slate-900/60">
      <div className="flex items-center gap-2 text-xs font-semibold opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
