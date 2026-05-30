import { api } from './api';

export interface Badge {
  code: string;
  title: string;
  description: string;
  awardedAt?: string;
}

export interface GamificationData {
  streakCount: number;
  badges: Badge[];
}

export async function fetchGamification(): Promise<GamificationData> {
  const { data } = await api.get<GamificationData>('/gamification');
  return data;
}
