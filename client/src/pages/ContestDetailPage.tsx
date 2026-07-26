import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenCheck, CheckCircle2, Clock, Flame, Gift, Medal, Play, Send, Trophy } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/api';
import {
  claimContestReward,
  fetchContest,
  fetchContestRoom,
  fetchMyContestReward,
  startContestRoom,
  submitContestRoom,
  type ContestDetail,
  type ContestRoom,
  type MyContestReward,
} from '@/lib/contestApi';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(value),
  );
}

export default function ContestDetailPage() {
  const { slug = '' } = useParams();
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [room, setRoom] = useState<ContestRoom | null>(null);
  const [myReward, setMyReward] = useState<MyContestReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [roomBusy, setRoomBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchContest(slug), fetchMyContestReward(slug), fetchContestRoom(slug)])
      .then(([contestData, myRewardData, roomData]) => {
        setContest(contestData);
        setMyReward(myRewardData);
        setRoom(roomData);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleClaim() {
    setClaiming(true);
    setError('');
    try {
      const claim = await claimContestReward(slug);
      setMyReward((prev) => (prev ? { ...prev, claim } : prev));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setClaiming(false);
    }
  }

  async function handleStartRoom() {
    setRoomBusy(true);
    setError('');
    try {
      setRoom(await startContestRoom(slug));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRoomBusy(false);
    }
  }

  async function handleSubmitRoom() {
    setRoomBusy(true);
    setError('');
    try {
      const nextRoom = await submitContestRoom(slug);
      setRoom(nextRoom);
      const [contestData, myRewardData] = await Promise.all([fetchContest(slug), fetchMyContestReward(slug)]);
      setContest(contestData);
      setMyReward(myRewardData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRoomBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!contest) return <Alert type="info">Không tìm thấy mùa thi đua.</Alert>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/contests"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại mùa thi
      </Link>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-ink-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
              {formatDate(contest.startsAt)} - {formatDate(contest.endsAt)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-gray-100">{contest.title}</h1>
            <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-400">{contest.description}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            <Trophy className="h-4 w-4" />
            Ranking theo mùa
          </span>
        </div>
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
          {contest.scoringNote}
        </p>
        {myReward && (
          <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Vị trí của bạn: {myReward.rank ? `#${myReward.rank}` : 'chưa có điểm'} · {myReward.score} điểm
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {myReward.reward
                    ? `Bạn đang đủ điều kiện nhận: ${myReward.reward.title}.`
                    : 'Hãy hoàn thành thêm bài học, bài tập hoặc quiz để lọt top nhận thưởng.'}
                </p>
                {myReward.claim && (
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Trạng thái yêu cầu:{' '}
                    {myReward.claim.status === 'PENDING'
                      ? 'Đang chờ quản trị viên duyệt'
                      : myReward.claim.status === 'APPROVED'
                        ? 'Đã duyệt'
                        : 'Đã từ chối'}
                    {myReward.claim.note ? ` · ${myReward.claim.note}` : ''}
                  </p>
                )}
              </div>
              {myReward.reward &&
                (!myReward.claim || myReward.claim.status === 'REJECTED') && (
                <button
                  type="button"
                  onClick={() => void handleClaim()}
                  disabled={claiming}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Gift className="h-4 w-4" />
                  {myReward.claim ? 'Gửi lại sau khi bị từ chối' : 'Yêu cầu nhận thưởng'}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Phòng thi riêng</h2>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800">
          {!room || room.contest.problems.length === 0 ? (
            <Alert type="info">Mùa này chưa có đề thi riêng.</Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Thời lượng: {room.contest.durationMinutes} phút · {room.contest.problems.length} câu
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Làm bài qua các liên kết bên dưới, sau đó quay lại nộp phòng thi để chốt điểm.
                  </p>
                  {room.attempt && (
                    <p className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-300">
                      Trạng thái: {room.attempt.status} · {room.attempt.score}/{room.attempt.maxScore} điểm
                    </p>
                  )}
                </div>
                {!room.attempt || room.attempt.status !== 'IN_PROGRESS' ? (
                  <button
                    type="button"
                    onClick={() => void handleStartRoom()}
                    disabled={!room.contest.canStart || roomBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play className="h-4 w-4" />
                    Bắt đầu phòng thi
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSubmitRoom()}
                    disabled={roomBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    Nộp phòng thi
                  </button>
                )}
              </div>

              <ol className="space-y-2">
                {room.contest.problems.map((problem, index) => {
                  const href =
                    problem.problemType === 'EXERCISE' && problem.exerciseId
                      ? `/exercises/${problem.exerciseId}`
                      : problem.lessonId
                        ? `/lessons/${problem.lessonId}/quiz`
                        : '#';
                  return (
                    <li key={problem.id} className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 dark:bg-white/5 md:flex-row md:items-center">
                      <span className="font-bold text-brand-600 dark:text-brand-300">Câu {index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{problem.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {problem.problemType === 'EXERCISE' ? 'Bài code' : 'Quiz'} · {problem.points} điểm
                        </p>
                      </div>
                      <Link
                        to={href}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/10"
                      >
                        Làm bài
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-5 w-5 text-brand-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cơ cấu phần thưởng</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {contest.rewards.map((reward) => (
            <article
              key={`${reward.rankFrom}-${reward.rankTo}`}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800"
            >
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-300">
                Hạng {reward.rankFrom === reward.rankTo ? reward.rankFrom : `${reward.rankFrom}-${reward.rankTo}`}
              </p>
              <h3 className="mt-1 font-bold text-gray-900 dark:text-gray-100">{reward.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Medal className="h-5 w-5 text-brand-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bảng xếp hạng</h2>
        </div>

        {contest.leaderboard.length === 0 ? (
          <Alert type="info">Chưa có học viên nào ghi điểm trong mùa này.</Alert>
        ) : (
          <ol className="space-y-2">
            {contest.leaderboard.map((row) => (
              <li
                key={`${row.rank}-${row.displayName}`}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-ink-800"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg font-extrabold text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                    {row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-gray-900 dark:text-gray-100">{row.displayName}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <BookOpenCheck className="h-3.5 w-3.5" />
                        {row.completedItems} mục học
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {row.passedSubmissions} bài pass
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" />
                        {row.streak} ngày
                      </span>
                    </div>
                  </div>
                  {row.reward && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                      {row.reward.title}
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-brand-600 dark:text-brand-300">{row.score} đ</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
