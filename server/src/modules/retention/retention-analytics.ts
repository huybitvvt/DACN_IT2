import { calculateRetentionHealth, type RetentionScoreInput } from './retention-score.js';

const DAY_MS = 86_400_000;

export interface RetentionProgressEvent {
  itemType: string;
  completedAt: Date | null;
}

export interface RetentionSubmissionEvent {
  exerciseId: string;
  status: string;
  createdAt: Date;
}

export interface RetentionQuizEvent {
  quizId: string;
  score: number;
  total: number;
  createdAt: Date;
}

export interface RetentionAnalyticsData {
  totalItems: number;
  lastActiveDate: Date | null;
  progress: RetentionProgressEvent[];
  submissions: RetentionSubmissionEvent[];
  quizAttempts: RetentionQuizEvent[];
}

export interface RetentionTrendPoint {
  date: string;
  score: number;
  riskLevel: 'ON_TRACK' | 'WATCH' | 'AT_RISK';
  activeDays14: number;
  completedItems14: number;
  activityUnits7: number;
}

function utcDayStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function utcDayEnd(value: Date) {
  return new Date(utcDayStart(value).getTime() + DAY_MS - 1);
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_MS);
}

function dayKey(value: Date) {
  return utcDayStart(value).toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date) {
  return Math.max(
    0,
    Math.floor((utcDayStart(end).getTime() - utcDayStart(start).getTime()) / DAY_MS),
  );
}

function inWindow(value: Date, start: Date, end: Date) {
  const time = value.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function activityDatesAt(data: RetentionAnalyticsData, asOf: Date) {
  const dates = [
    ...data.progress.flatMap((event) => (event.completedAt ? [event.completedAt] : [])),
    ...data.submissions.map((event) => event.createdAt),
    ...data.quizAttempts.map((event) => event.createdAt),
    ...(data.lastActiveDate ? [data.lastActiveDate] : []),
  ].filter((date) => date <= asOf);
  return [...new Set(dates.map(dayKey))].sort();
}

function effectiveStreak(activityDays: string[], asOf: Date) {
  if (activityDays.length === 0) return 0;
  const days = new Set(activityDays);
  const today = dayKey(asOf);
  const yesterday = dayKey(addDays(utcDayStart(asOf), -1));
  let cursor = days.has(today)
    ? utcDayStart(asOf)
    : days.has(yesterday)
      ? addDays(utcDayStart(asOf), -1)
      : null;
  if (!cursor) return 0;

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function uniqueExerciseStats(events: RetentionSubmissionEvent[]) {
  const attempted = new Set(events.map((event) => event.exerciseId));
  const passed = new Set(
    events.filter((event) => event.status === 'PASSED').map((event) => event.exerciseId),
  );
  return { attempted: attempted.size, passed: passed.size };
}

function quizStats(events: RetentionQuizEvent[]) {
  const bestByQuiz = new Map<string, number>();
  for (const attempt of events) {
    if (attempt.total <= 0) continue;
    const percent = Math.round((attempt.score / attempt.total) * 100);
    bestByQuiz.set(attempt.quizId, Math.max(bestByQuiz.get(attempt.quizId) ?? 0, percent));
  }
  const values = [...bestByQuiz.values()];
  return {
    attempts: values.length,
    averagePercent:
      values.length === 0
        ? 0
        : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
  };
}

function activityUnits(data: RetentionAnalyticsData, start: Date, end: Date) {
  const lessonCompletions = data.progress.filter(
    (event) =>
      event.itemType === 'LESSON' && event.completedAt && inWindow(event.completedAt, start, end),
  ).length;
  const submissions = data.submissions.filter((event) => inWindow(event.createdAt, start, end));
  const exercise = uniqueExerciseStats(submissions);
  const quizzes = new Set(
    data.quizAttempts
      .filter((event) => inWindow(event.createdAt, start, end))
      .map((event) => event.quizId),
  ).size;

  // Pass bài được thêm một đơn vị chất lượng, nhưng mỗi exercise chỉ được tính một lần.
  return lessonCompletions + exercise.attempted + exercise.passed + quizzes;
}

export function buildRetentionScoreInputAt(
  data: RetentionAnalyticsData,
  asOf: Date,
): RetentionScoreInput {
  const end = asOf;
  const since7 = addDays(end, -7);
  const since14 = addDays(end, -14);
  const since28 = addDays(end, -28);
  const completedAtDate = data.progress.filter(
    (event): event is RetentionProgressEvent & { completedAt: Date } =>
      Boolean(event.completedAt && event.completedAt <= end),
  );
  const recentProgress = completedAtDate.filter((event) =>
    inWindow(event.completedAt, since14, end),
  );
  const previousProgress = completedAtDate.filter((event) =>
    inWindow(event.completedAt, since28, since14),
  );
  const recentSubmissions = data.submissions.filter((event) =>
    inWindow(event.createdAt, since14, end),
  );
  const recentQuizzes = data.quizAttempts.filter((event) =>
    inWindow(event.createdAt, since14, end),
  );
  const exercise = uniqueExerciseStats(recentSubmissions);
  const quiz = quizStats(recentQuizzes);
  const activeDays = activityDatesAt(data, end);
  const activeDays14 = activeDays.filter((date) => {
    const value = new Date(`${date}T00:00:00.000Z`);
    return inWindow(value, utcDayStart(since14), end);
  }).length;
  const lastActivityKey = activeDays.at(-1);
  const lastActivity = lastActivityKey ? new Date(`${lastActivityKey}T00:00:00.000Z`) : null;

  return {
    daysInactive: lastActivity ? daysBetween(lastActivity, end) : 99,
    overallPercent:
      data.totalItems === 0
        ? 0
        : Math.min(100, Math.round((completedAtDate.length / data.totalItems) * 100)),
    effectiveStreak: effectiveStreak(activeDays, end),
    activeDays14,
    completedItems14: recentProgress.length,
    completedItemsPrevious14: previousProgress.length,
    attemptedExercises14: exercise.attempted,
    passedExercises14: exercise.passed,
    quizAttempts14: quiz.attempts,
    averageQuizPercent14: quiz.averagePercent,
    activityUnits7: activityUnits(data, since7, end),
    activityUnitsPrevious7: activityUnits(data, since14, since7),
  };
}

export function buildRetentionTrend(data: RetentionAnalyticsData, now: Date, days = 28) {
  const today = utcDayStart(now);
  const points: RetentionTrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    const asOf = offset === 0 ? now : utcDayEnd(date);
    const input = buildRetentionScoreInputAt(data, asOf);
    const result = calculateRetentionHealth(input);
    points.push({
      date: dayKey(date),
      score: result.score,
      riskLevel: result.riskLevel,
      activeDays14: input.activeDays14,
      completedItems14: input.completedItems14,
      activityUnits7: input.activityUnits7,
    });
  }

  const current = points.at(-1)?.score ?? 0;
  const sevenDaysAgo = points[Math.max(0, points.length - 8)]?.score ?? current;
  const delta7d = current - sevenDaysAgo;
  return {
    points,
    summary: {
      delta7d,
      direction: delta7d > 2 ? 'UP' : delta7d < -2 ? 'DOWN' : 'STABLE',
      averageScore: Math.round(
        points.reduce((sum, point) => sum + point.score, 0) / Math.max(1, points.length),
      ),
      bestScore: Math.max(0, ...points.map((point) => point.score)),
    },
  } as const;
}
