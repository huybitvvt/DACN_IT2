import { useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Flame,
  Gift,
  Mail,
  Send,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ProgressBar from '@/components/ProgressBar';
import { getErrorMessage } from '@/lib/api';
import {
  adminListRetentionRisks,
  adminAssignRetentionIntervention,
  type AdminRetentionRisk,
  type AdminRetentionRisksResponse,
} from '@/lib/adminApi';

const riskLabel: Record<AdminRetentionRisk['riskLevel'], string> = {
  HIGH: 'Nguy cơ cao',
  MEDIUM: 'Cần theo dõi',
  LOW: 'Ổn định',
};

const riskTone: Record<AdminRetentionRisk['riskLevel'], string> = {
  HIGH: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-900',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900',
  LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
};

function inactiveText(days: number) {
  if (days >= 90) return 'chưa hoạt động';
  if (days === 0) return 'hôm nay';
  if (days === 1) return '1 ngày';
  return `${days} ngày`;
}

function metricTone(value: number) {
  if (value >= 75) return 'text-emerald-600 dark:text-emerald-300';
  if (value >= 45) return 'text-amber-600 dark:text-amber-300';
  return 'text-rose-600 dark:text-rose-300';
}

export default function AdminRetention() {
  const [data, setData] = useState<AdminRetentionRisksResponse | null>(null);
  const [filter, setFilter] = useState<'ALL' | AdminRetentionRisk['riskLevel']>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigningUserId, setAssigningUserId] = useState('');

  async function load() {
    try {
      setData(await adminListRetentionRisks());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function assignIntervention(userId: string) {
    setAssigningUserId(userId);
    setError('');
    try {
      await adminAssignRetentionIntervention(userId);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAssigningUserId('');
    }
  }

  const learners = useMemo(() => {
    if (!data) return [];
    return filter === 'ALL' ? data.learners : data.learners.filter((learner) => learner.riskLevel === filter);
  }, [data, filter]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
          Can thiệp sớm
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          Học viên có nguy cơ rơi nhịp
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Dashboard này chỉ tính trên học viên đã thanh toán khoá học, để admin tập trung đúng nhóm cần giữ chân.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={Users} label="Học viên trả phí" value={data.summary.totalPaidLearners} />
        <SummaryCard icon={ShieldAlert} label="Nguy cơ cao" value={data.summary.highRisk} tone="rose" />
        <SummaryCard icon={AlertTriangle} label="Cần theo dõi" value={data.summary.mediumRisk} tone="amber" />
        <SummaryCard icon={CheckCircle2} label="Ổn định" value={data.summary.lowRisk} tone="emerald" />
        <SummaryCard icon={Gift} label="Thưởng chờ duyệt" value={data.summary.pendingRewards} tone="brand" />
        <SummaryCard icon={Send} label="Gói đang chạy" value={data.summary.activeInterventions} tone="brand" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Danh sách ưu tiên</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Sắp xếp theo điểm giữ nhịp thấp nhất, số ngày không học và tiến độ.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['ALL', 'Tất cả'],
              ['HIGH', 'Nguy cơ cao'],
              ['MEDIUM', 'Cần theo dõi'],
              ['LOW', 'Ổn định'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as typeof filter)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  filter === value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {learners.length === 0 ? (
            <Alert type="info">Không có học viên trong nhóm này.</Alert>
          ) : (
            learners.map((learner) => (
              <article
                key={learner.user.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{learner.user.displayName}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${riskTone[learner.riskLevel]}`}>
                        {riskLabel[learner.riskLevel]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{learner.user.email}</p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <MiniMetric icon={TrendingUp} label="Tiến độ" value={`${learner.overallPercent}%`} />
                      <MiniMetric icon={Clock3} label="Không học" value={inactiveText(learner.daysInactive)} />
                      <MiniMetric icon={Flame} label="Streak" value={`${learner.streak} ngày`} />
                      <MiniMetric icon={Gift} label="Thưởng chờ" value={`${learner.pendingRewards}`} />
                    </div>

                    {learner.weakestCourse && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
                              Khoá cần can thiệp
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">{learner.weakestCourse.title}</p>
                          </div>
                          <Link
                            to={`/roadmap/${learner.weakestCourse.slug}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
                          >
                            Lộ trình
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                        <div className="mt-3">
                          <ProgressBar percent={learner.weakestCourse.percent} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full rounded-lg border border-gray-200 p-3 dark:border-gray-700 lg:w-80">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Điểm giữ nhịp</p>
                    <p className={`mt-1 text-3xl font-black ${metricTone(learner.healthScore)}`}>
                      {learner.healthScore}
                      <span className="text-sm font-bold text-gray-400">/100</span>
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
                      {learner.suggestedAction}
                    </p>
                    <details className="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-900">
                      <summary className="cursor-pointer font-semibold text-gray-700 dark:text-slate-200">
                        Vì sao có điểm này?
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-slate-400">
                        {learner.scoreFormula.reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                        {learner.scoreFormula.factors.map((factor) => (
                          <li key={factor.key}>
                            {factor.label}: {factor.score}/{factor.maxScore}
                          </li>
                        ))}
                      </ul>
                    </details>
                    {learner.latestIntervention && (
                      <div className="mt-3 rounded-lg border border-brand-200 p-3 text-xs dark:border-brand-900">
                        <p className="font-bold text-brand-700 dark:text-brand-300">
                          Gói cứu nhịp: {learner.latestIntervention.status}
                        </p>
                        <p className="mt-1 text-gray-600 dark:text-slate-400">
                          {learner.latestIntervention.completedMissions}/{learner.latestIntervention.targetMissions} nhiệm vụ
                          {typeof learner.latestIntervention.outcome?.scoreDelta === 'number'
                            ? ` · ${learner.latestIntervention.outcome.scoreDelta >= 0 ? '+' : ''}${learner.latestIntervention.outcome.scoreDelta} điểm`
                            : ''}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={
                        assigningUserId === learner.user.id ||
                        learner.latestIntervention?.status === 'ACTIVE'
                      }
                      onClick={() => void assignIntervention(learner.user.id)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-300 px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-950"
                    >
                      <Send className="h-4 w-4" />
                      {learner.latestIntervention?.status === 'ACTIVE'
                        ? 'Đang có gói cứu nhịp'
                        : assigningUserId === learner.user.id
                          ? 'Đang giao...'
                          : 'Giao gói cứu nhịp 48 giờ'}
                    </button>
                    <a
                      href={`mailto:${learner.user.email}?subject=CodeLearn%20-%20nhac%20hoc%20va%20nhiem%20vu%20hom%20nay`}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <Mail className="h-4 w-4" />
                      Soạn email nhắc học
                    </a>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: ElementType;
  label: string;
  value: number;
  tone?: 'slate' | 'rose' | 'amber' | 'emerald' | 'brand';
}) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200',
  };
  return (
    <div className={`rounded-xl p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-80">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
