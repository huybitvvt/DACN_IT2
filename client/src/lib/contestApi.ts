import { api } from './api';

export interface ContestReward {
  id: string;
  rankFrom: number;
  rankTo: number;
  title: string;
  description: string;
  rewardType: string;
  valueVnd: number | null;
  percentOff: number | null;
}

export interface ContestLeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  completedItems: number;
  passedSubmissions: number;
  quizPoints: number;
  examScore: number;
  streak: number;
  badges: number;
  reward: ContestReward | null;
}

export interface ContestRoomProblem {
  id: string;
  problemType: 'EXERCISE' | 'QUIZ';
  title: string;
  points: number;
  order: number;
  exerciseId: string | null;
  quizId: string | null;
  lessonId: string | null;
}

export interface ContestRoom {
  contest: {
    id: string;
    slug: string;
    title: string;
    status: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
    startsAt: string;
    endsAt: string;
    durationMinutes: number;
    canStart: boolean;
    problems: ContestRoomProblem[];
  };
  attempt: {
    id: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    startedAt: string;
    expiresAt: string;
    submittedAt: string | null;
    score: number;
    maxScore: number;
  } | null;
}

export interface ContestSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
  courseSlug: string | null;
  startsAt: string;
  endsAt: string;
  scoringNote: string;
  rewards: ContestReward[];
  participantCount: number;
  topUsers: ContestLeaderboardEntry[];
}

export interface ContestDetail extends Omit<ContestSummary, 'participantCount' | 'topUsers'> {
  leaderboard: ContestLeaderboardEntry[];
}

export interface MyContestReward {
  rank: number | null;
  score: number;
  reward: ContestReward | null;
  claim: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    note: string;
    rank: number;
    score: number;
    createdAt: string;
    reviewedAt: string | null;
    reward: ContestReward;
  } | null;
}

export async function fetchContests(): Promise<ContestSummary[]> {
  const { data } = await api.get<{ contests: ContestSummary[] }>('/contests');
  return data.contests;
}

export async function fetchContest(slug: string): Promise<ContestDetail> {
  const { data } = await api.get<{ contest: ContestDetail }>(`/contests/${slug}`);
  return data.contest;
}

export async function fetchMyContestReward(slug: string): Promise<MyContestReward> {
  const { data } = await api.get<MyContestReward>(`/contests/${slug}/me`);
  return data;
}

export async function claimContestReward(slug: string): Promise<MyContestReward['claim']> {
  const { data } = await api.post<{ claim: MyContestReward['claim'] }>(`/contests/${slug}/claim-reward`);
  return data.claim;
}

export async function fetchContestRoom(slug: string): Promise<ContestRoom> {
  const { data } = await api.get<ContestRoom>(`/contests/${slug}/room`);
  return data;
}

export async function startContestRoom(slug: string): Promise<ContestRoom> {
  const { data } = await api.post<ContestRoom>(`/contests/${slug}/room/start`);
  return data;
}

export async function submitContestRoom(slug: string): Promise<ContestRoom> {
  const { data } = await api.post<ContestRoom>(`/contests/${slug}/room/submit`);
  return data;
}
