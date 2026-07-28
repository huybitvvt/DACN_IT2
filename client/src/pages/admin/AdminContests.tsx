import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, Save, Trash2, XCircle } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/api';
import {
  adminCreateContest,
  adminDeleteContest,
  adminListContests,
  adminListRewardClaims,
  adminUpdateContest,
  adminUpdateRewardClaim,
  type AdminContest,
  type AdminContestProblem,
  type AdminContestReward,
  type AdminRewardClaim,
} from '@/lib/adminApi';

type ContestForm = Omit<AdminContest, 'id'> & { id?: string };

const emptyReward: AdminContestReward = {
  rankFrom: 1,
  rankTo: 1,
  title: '',
  description: '',
  rewardType: 'BADGE',
  valueVnd: null,
  percentOff: null,
};

const emptyProblem: AdminContestProblem = {
  problemType: 'EXERCISE',
  exerciseId: '',
  quizId: null,
  title: '',
  points: 100,
  order: 0,
};

function toInputDate(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultForm(): ContestForm {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  return {
    slug: 'new-sprint',
    title: '',
    description: '',
    status: 'ACTIVE',
    courseSlug: null,
    startsAt: toInputDate(now.toISOString()),
    endsAt: toInputDate(end.toISOString()),
    durationMinutes: 45,
    scoringNote:
      'Thang 1.000 điểm: bài học 200, bài code 250, quiz 150, phòng thi 300 và độ đều 100. Chỉ tính hoạt động trong mùa; mỗi bài dùng kết quả tốt nhất.',
    rewards: [
      {
        ...emptyReward,
        title: 'Hoàn 50% học phí',
        description: 'Top 1 được hoàn 50% học phí.',
        rewardType: 'TUITION_REFUND',
        percentOff: 50,
      },
    ],
    problems: [{ ...emptyProblem, title: 'Bài code trong phòng thi' }],
  };
}

export default function AdminContests() {
  const [contests, setContests] = useState<AdminContest[]>([]);
  const [claims, setClaims] = useState<AdminRewardClaim[]>([]);
  const [form, setForm] = useState<ContestForm>(() => defaultForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [contestRows, claimRows] = await Promise.all([
        adminListContests(),
        adminListRewardClaims(),
      ]);
      setContests(contestRows);
      setClaims(claimRows);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedTitle = useMemo(
    () => (form.id ? `Đang sửa: ${form.title || form.slug}` : 'Tạo mùa thi mới'),
    [form.id, form.slug, form.title],
  );

  function editContest(contest: AdminContest) {
    setForm({
      ...contest,
      startsAt: toInputDate(contest.startsAt),
      endsAt: toInputDate(contest.endsAt),
      rewards: contest.rewards.length > 0 ? contest.rewards : [{ ...emptyReward }],
    });
    setMessage('');
    setError('');
  }

  function updateReward(index: number, patch: Partial<AdminContestReward>) {
    setForm((current) => ({
      ...current,
      rewards: current.rewards.map((reward, i) => (i === index ? { ...reward, ...patch } : reward)),
    }));
  }

  function updateProblem(index: number, patch: Partial<AdminContestProblem>) {
    setForm((current) => ({
      ...current,
      problems: current.problems.map((problem, i) =>
        i === index ? { ...problem, ...patch } : problem,
      ),
    }));
  }

  async function saveContest() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        courseSlug: form.courseSlug || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      };
      if (form.id) {
        await adminUpdateContest(form.id, payload);
        setMessage('Đã cập nhật mùa thi.');
      } else {
        await adminCreateContest(payload);
        setMessage('Đã tạo mùa thi mới.');
      }
      setForm(defaultForm());
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeContest(id: string) {
    if (!window.confirm('Xoá mùa thi này?')) return;
    try {
      await adminDeleteContest(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function reviewClaim(id: string, status: AdminRewardClaim['status']) {
    try {
      const note =
        status === 'APPROVED'
          ? 'Đã duyệt, admin liên hệ học viên để hoàn học phí/voucher.'
          : 'Không đủ điều kiện nhận thưởng ở thời điểm duyệt.';
      await adminUpdateRewardClaim(id, { status, note });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản trị thi đua</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Cấu hình mùa thi, phần thưởng và duyệt yêu cầu hoàn học phí/voucher.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedTitle}</h2>
          <button
            type="button"
            onClick={() => setForm(defaultForm())}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <Plus className="h-4 w-4" />
            Mùa mới
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Slug</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Tiêu đề</span>
            <input
              value={form.title}
              onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Trạng thái</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((c) => ({ ...c, status: e.target.value as ContestForm['status'] }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
            >
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="ACTIVE">Đang diễn ra</option>
              <option value="FINISHED">Đã kết thúc</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Khoá áp dụng</span>
            <input
              value={form.courseSlug ?? ''}
              placeholder="Để trống nếu áp dụng toàn hệ thống"
              onChange={(e) => setForm((c) => ({ ...c, courseSlug: e.target.value || null }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Bắt đầu</span>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((c) => ({ ...c, startsAt: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Kết thúc</span>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((c) => ({ ...c, endsAt: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">
              Thời lượng phòng thi (phút)
            </span>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm((c) => ({ ...c, durationMinutes: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
            />
          </label>
        </div>

        <label className="mt-3 block space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">Mô tả</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
          />
        </label>

        <label className="mt-3 block space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">Cách tính điểm</span>
          <textarea
            value={form.scoringNote}
            onChange={(e) => setForm((c) => ({ ...c, scoringNote: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
          />
        </label>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Đề phòng thi</h3>
            <button
              type="button"
              onClick={() =>
                setForm((c) => ({
                  ...c,
                  problems: [...c.problems, { ...emptyProblem, order: c.problems.length }],
                }))
              }
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              Thêm câu thi
            </button>
          </div>
          {form.problems.map((problem, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:grid-cols-6"
            >
              <select
                value={problem.problemType}
                onChange={(e) =>
                  updateProblem(index, {
                    problemType: e.target.value as AdminContestProblem['problemType'],
                    exerciseId: e.target.value === 'EXERCISE' ? problem.exerciseId || '' : null,
                    quizId: e.target.value === 'QUIZ' ? problem.quizId || '' : null,
                  })
                }
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
              >
                <option value="EXERCISE">Bài code</option>
                <option value="QUIZ">Quiz</option>
              </select>
              <input
                value={
                  problem.problemType === 'EXERCISE'
                    ? (problem.exerciseId ?? '')
                    : (problem.quizId ?? '')
                }
                onChange={(e) =>
                  updateProblem(
                    index,
                    problem.problemType === 'EXERCISE'
                      ? { exerciseId: e.target.value }
                      : { quizId: e.target.value },
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white md:col-span-2"
                placeholder={problem.problemType === 'EXERCISE' ? 'Exercise ID' : 'Quiz ID'}
              />
              <input
                value={problem.title}
                onChange={(e) => updateProblem(index, { title: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white md:col-span-2"
                placeholder="Tên câu thi"
              />
              <input
                type="number"
                value={problem.points}
                onChange={(e) => updateProblem(index, { points: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
                placeholder="Điểm"
              />
              <input
                type="number"
                value={problem.order}
                onChange={(e) => updateProblem(index, { order: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
                placeholder="Thứ tự"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((c) => ({ ...c, problems: c.problems.filter((_, i) => i !== index) }))
                }
                className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-500/10"
                aria-label="Xoá câu thi"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Phần thưởng</h3>
            <button
              type="button"
              onClick={() =>
                setForm((c) => ({ ...c, rewards: [...c.rewards, { ...emptyReward }] }))
              }
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              Thêm phần thưởng
            </button>
          </div>
          {form.rewards.map((reward, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:grid-cols-6"
            >
              <input
                type="number"
                value={reward.rankFrom}
                onChange={(e) => updateReward(index, { rankFrom: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
                aria-label="Hạng từ"
              />
              <input
                type="number"
                value={reward.rankTo}
                onChange={(e) => updateReward(index, { rankTo: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
                aria-label="Hạng đến"
              />
              <input
                value={reward.title}
                onChange={(e) => updateReward(index, { title: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white md:col-span-2"
                placeholder="Tên phần thưởng"
              />
              <select
                value={reward.rewardType}
                onChange={(e) =>
                  updateReward(index, {
                    rewardType: e.target.value as AdminContestReward['rewardType'],
                  })
                }
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
              >
                <option value="TUITION_REFUND">Hoàn học phí</option>
                <option value="VOUCHER">Voucher</option>
                <option value="BADGE">Huy hiệu</option>
                <option value="UNLOCK">Mở khoá</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setForm((c) => ({ ...c, rewards: c.rewards.filter((_, i) => i !== index) }))
                }
                className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-500/10"
                aria-label="Xoá phần thưởng"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <input
                value={reward.description}
                onChange={(e) => updateReward(index, { description: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white md:col-span-4"
                placeholder="Mô tả phần thưởng"
              />
              <input
                type="number"
                value={reward.percentOff ?? ''}
                onChange={(e) =>
                  updateReward(index, {
                    percentOff: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-ink-900 dark:text-white"
                placeholder="%"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void saveContest()}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu...' : 'Lưu mùa thi'}
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
          Danh sách mùa thi
        </h2>
        <div className="space-y-2">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:flex-row md:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{contest.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {contest.slug} · {contest.status} · {contest.rewards.length} phần thưởng ·{' '}
                  {contest.problems.length} câu thi
                </p>
              </div>
              <button
                type="button"
                onClick={() => editContest(contest)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => void removeContest(contest.id)}
                className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-500/10"
              >
                Xoá
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
          Yêu cầu nhận thưởng
        </h2>
        {claims.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có yêu cầu nào.</p>
        ) : (
          <div className="space-y-2">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {claim.user.displayName} · #{claim.rank} · {claim.score} điểm
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {claim.contest.title} · {claim.reward.title} · {claim.status}
                  </p>
                  {claim.note && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{claim.note}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void reviewClaim(claim.id, 'APPROVED')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Duyệt
                </button>
                <button
                  type="button"
                  onClick={() => void reviewClaim(claim.id, 'REJECTED')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-500/10"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
