import { api } from './api';

export interface LeaderboardEntry {
  displayName: string;
  completed: number;
  passedExercises: number;
  quizPoints: number;
  activeDays: number;
  score: number;
  formulaVersion: string;
}

export interface LeaderboardResult {
  leaderboard: LeaderboardEntry[];
  period: {
    days: number;
    startsAt: string;
    endsAt: string;
  };
}

export async function fetchLeaderboard(): Promise<LeaderboardResult> {
  const { data } = await api.get<LeaderboardResult>('/leaderboard');
  return data;
}
