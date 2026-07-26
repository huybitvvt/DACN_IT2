import { useEffect, useState } from 'react';
import { ArrowRight, BrainCircuit, CheckCircle2, Code2, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/api';
import {
  fetchLearningErrorProfile,
  type LearningErrorProfile,
} from '@/lib/learningProfileApi';

export default function LearningProfilePage() {
  const [profile, setProfile] = useState<LearningErrorProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLearningErrorProfile().then(setProfile).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!profile) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-brand-600 dark:text-brand-300">Code DNA</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Hồ sơ lỗi lập trình</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-600 dark:text-slate-400">
          Phân tích từ submission thật để tìm lỗi lặp lại. Đây là chẩn đoán theo quy tắc minh bạch, không thay thế việc đọc lỗi của trình biên dịch.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Code2} label="Tổng lượt nộp" value={profile.summary.totalSubmissions} />
        <Metric icon={CheckCircle2} label="Đã pass" value={profile.summary.passedSubmissions} />
        <Metric icon={Target} label="Tỷ lệ pass" value={`${profile.summary.passRate}%`} />
        <Metric
          icon={TrendingUp}
          label="Xu hướng gần đây"
          value={`${profile.summary.trendDelta >= 0 ? '+' : ''}${profile.summary.trendDelta}%`}
        />
      </section>

      {profile.summary.totalSubmissions === 0 ? (
        <Alert type="info">Hãy nộp bài tập để hệ thống bắt đầu xây hồ sơ lỗi.</Alert>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Nhóm lỗi thường gặp</h2>
            <div className="mt-4 space-y-4">
              {profile.categories.length === 0 ? (
                <Alert type="success">Các submission gần đây chưa ghi nhận nhóm lỗi lặp lại.</Alert>
              ) : (
                profile.categories.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-gray-800 dark:text-slate-200">{category.label}</span>
                      <span className="text-gray-500">{category.count} lần · {category.percent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-900">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.max(3, category.percent)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-slate-400">
                      {category.recommendation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-gray-900 dark:text-white">Ưu tiên luyện tập</h2>
            </div>
            <div className="mt-4 space-y-3">
              {profile.recommendations.map((item) => (
                <article key={item.category} className="rounded-lg bg-gray-50 p-4 dark:bg-slate-900">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400">{item.description}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
        <h2 className="font-bold text-gray-900 dark:text-white">Lỗi gần đây</h2>
        <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
          {profile.recentErrors.map((item) => (
            <Link
              key={item.id}
              to={`/exercises/${item.exercise.id}`}
              className="flex items-center justify-between gap-4 py-3 text-sm hover:text-brand-600"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{item.exercise.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.exercise.language} · {item.label} · {new Date(item.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </Link>
          ))}
          {profile.recentErrors.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">Chưa có lỗi gần đây.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Code2;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 dark:text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
