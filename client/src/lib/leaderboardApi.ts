import { api } from './api';

export interface LeaderboardEntry {
  displayName: string;
  completed: number;
  badges: number;
  streak: number;
  score: number;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<{ leaderboard: LeaderboardEntry[] }>('/leaderboard');
  return data.leaderboard;
}
