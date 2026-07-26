import { api } from './api';
import type { ProgrammingLanguage, Role } from '@/types';
import type { PurchaseStatus } from './paymentApi';

export interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  language: ProgrammingLanguage;
  description: string;
  order: number;
}

export interface AdminLesson {
  id: string;
  courseId: string;
  title: string;
  contentMarkdown: string;
  order: number;
  isPublic: boolean;
}

export interface AdminTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface AdminExercise {
  id: string;
  lessonId: string;
  title: string;
  promptMarkdown: string;
  language: ProgrammingLanguage;
  starterCode: string;
  order: number;
  testCases: AdminTestCase[];
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  streakCount: number;
  createdAt: string;
}

export interface AdminPurchase {
  id: string;
  status: PurchaseStatus;
  amountVnd: number;
  paymentCode: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  course: {
    id: string;
    slug: string;
    title: string;
    language: ProgrammingLanguage;
  };
}

export interface AdminContestReward {
  id?: string;
  rankFrom: number;
  rankTo: number;
  title: string;
  description: string;
  rewardType: 'TUITION_REFUND' | 'VOUCHER' | 'BADGE' | 'UNLOCK';
  valueVnd: number | null;
  percentOff: number | null;
}

export interface AdminContestProblem {
  id?: string;
  problemType: 'EXERCISE' | 'QUIZ';
  exerciseId: string | null;
  quizId: string | null;
  title: string;
  points: number;
  order: number;
}

export interface AdminContest {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
  courseSlug: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  scoringNote: string;
  rewards: AdminContestReward[];
  problems: AdminContestProblem[];
}

export interface AdminRewardClaim {
  id: string;
  rank: number;
  score: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note: string;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; email: string; displayName: string };
  contest: { id: string; slug: string; title: string };
  reward: {
    id: string;
    title: string;
    description: string;
    rewardType: string;
    percentOff: number | null;
    valueVnd: number | null;
  };
}

export interface AdminRetentionRisk {
  user: { id: string; email: string; displayName: string };
  healthScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  daysInactive: number;
  streak: number;
  overallPercent: number;
  paidCourses: number;
  completedItems: number;
  totalItems: number;
  recent: {
    submissions: number;
    passedSubmissions: number;
    quizAttempts: number;
  };
  pendingRewards: number;
  scoreFormula: {
    version: string;
    factors: Array<{
      key: string;
      label: string;
      score: number;
      maxScore: number;
      explanation: string;
    }>;
    reasons: string[];
  };
  latestIntervention: {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    source: 'SYSTEM' | 'ADMIN';
    baselineHealthScore: number;
    targetMissions: number;
    completedMissions: number;
    startsAt: string;
    dueAt: string;
    completedAt: string | null;
    outcome: { scoreDelta?: number; completionRate?: number } | null;
  } | null;
  weakestCourse: {
    id: string;
    slug: string;
    title: string;
    completed: number;
    total: number;
    percent: number;
  } | null;
  suggestedAction: string;
}

export interface AdminRetentionRisksResponse {
  summary: {
    totalPaidLearners: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    pendingRewards: number;
    activeInterventions: number;
  };
  learners: AdminRetentionRisk[];
}

// ---- Courses ----
export const adminListCourses = () =>
  api.get<{ courses: AdminCourse[] }>('/admin/courses').then((r) => r.data.courses);
export const adminCreateCourse = (data: Partial<AdminCourse>) =>
  api.post('/admin/courses', data).then((r) => r.data);
export const adminUpdateCourse = (id: string, data: Partial<AdminCourse>) =>
  api.put(`/admin/courses/${id}`, data).then((r) => r.data);
export const adminDeleteCourse = (id: string) =>
  api.delete(`/admin/courses/${id}`).then((r) => r.data);

// ---- Lessons ----
export const adminListLessons = (courseId?: string) =>
  api
    .get<{ lessons: AdminLesson[] }>('/admin/lessons', { params: { courseId } })
    .then((r) => r.data.lessons);
export const adminCreateLesson = (data: Partial<AdminLesson>) =>
  api.post('/admin/lessons', data).then((r) => r.data);
export const adminUpdateLesson = (id: string, data: Partial<AdminLesson>) =>
  api.put(`/admin/lessons/${id}`, data).then((r) => r.data);
export const adminDeleteLesson = (id: string) =>
  api.delete(`/admin/lessons/${id}`).then((r) => r.data);

// ---- Exercises ----
export const adminListExercises = (lessonId?: string) =>
  api
    .get<{ exercises: AdminExercise[] }>('/admin/exercises', { params: { lessonId } })
    .then((r) => r.data.exercises);
export const adminCreateExercise = (data: Partial<AdminExercise>) =>
  api.post('/admin/exercises', data).then((r) => r.data);
export const adminUpdateExercise = (id: string, data: Partial<AdminExercise>) =>
  api.put(`/admin/exercises/${id}`, data).then((r) => r.data);
export const adminDeleteExercise = (id: string) =>
  api.delete(`/admin/exercises/${id}`).then((r) => r.data);

// ---- Users ----
export const adminListUsers = () =>
  api.get<{ users: AdminUser[] }>('/admin/users').then((r) => r.data.users);

export const adminListRetentionRisks = () =>
  api.get<AdminRetentionRisksResponse>('/admin/retention-risks').then((r) => r.data);

export const adminAssignRetentionIntervention = (userId: string) =>
  api
    .post(`/admin/retention-interventions/${userId}`)
    .then((response) => response.data.intervention);

// ---- Purchases ----
export const adminListPurchases = (params: { status?: PurchaseStatus | ''; q?: string }) =>
  api
    .get<{ purchases: AdminPurchase[] }>('/admin/purchases', { params })
    .then((r) => r.data.purchases);

export const adminMarkPurchasePaid = (id: string) =>
  api.post<{ purchase: AdminPurchase }>(`/admin/purchases/${id}/mark-paid`).then((r) => r.data.purchase);

// ---- Contests ----
export const adminListContests = () =>
  api.get<{ contests: AdminContest[] }>('/admin/contests').then((r) => r.data.contests);
export const adminCreateContest = (data: Partial<AdminContest>) =>
  api.post<{ contest: AdminContest }>('/admin/contests', data).then((r) => r.data.contest);
export const adminUpdateContest = (id: string, data: Partial<AdminContest>) =>
  api.put<{ contest: AdminContest }>(`/admin/contests/${id}`, data).then((r) => r.data.contest);
export const adminDeleteContest = (id: string) =>
  api.delete(`/admin/contests/${id}`).then((r) => r.data);

export const adminListRewardClaims = () =>
  api.get<{ claims: AdminRewardClaim[] }>('/admin/reward-claims').then((r) => r.data.claims);
export const adminUpdateRewardClaim = (
  id: string,
  data: { status: AdminRewardClaim['status']; note?: string },
) =>
  api
    .put<{ claim: AdminRewardClaim }>(`/admin/reward-claims/${id}`, data)
    .then((r) => r.data.claim);
