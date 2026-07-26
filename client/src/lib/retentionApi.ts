import { api } from './api';

export type RiskLevel = 'NOT_STARTED' | 'ON_TRACK' | 'WATCH' | 'AT_RISK';
export type MissionType = 'COURSE' | 'LESSON' | 'EXERCISE' | 'QUIZ' | 'CONTEST';

export interface RetentionMission {
  id: string;
  itemId: string | null;
  type: MissionType;
  title: string;
  description: string;
  points: number;
  minutes: number;
  ctaLabel: string;
  ctaHref: string;
}

export interface RetentionScoreFactor {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export interface LearningIntervention {
  id: string;
  source: 'SYSTEM' | 'ADMIN';
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  reason: string;
  reasonFactors: string[];
  baselineHealthScore: number;
  targetMissions: number;
  completedMissions: number;
  startsAt: string;
  dueAt: string;
  completedAt: string | null;
  outcome: {
    completedMissions?: number;
    targetMissions?: number;
    completionRate?: number;
    healthScoreAfter?: number;
    scoreDelta?: number;
    elapsedHours?: number;
  } | null;
  missions: Array<{
    id: string;
    missionKey: string;
    type: MissionType;
    itemId: string | null;
    title: string;
    description: string;
    ctaHref: string;
    estimatedMinutes: number;
    completedAt: string | null;
  }>;
}

export interface RetentionIncentive {
  id: string;
  contestTitle: string;
  title: string;
  description: string;
  rewardType: string;
  rankFrom: number;
  rankTo: number;
  percentOff: number | null;
  valueVnd: number | null;
  ctaHref: string;
}

export interface RetentionPlan {
  healthScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  riskMessage: string;
  scoreFormula: {
    version: string;
    factors: RetentionScoreFactor[];
    reasons: string[];
  };
  focusCourse: {
    courseId: string;
    slug: string;
    title: string;
    completed: number;
    total: number;
    percent: number;
  } | null;
  metrics: {
    completedItems: number;
    totalItems: number;
    overallPercent: number;
    streak: number;
    daysInactive: number;
    badges: number;
    activeContestCount: number;
    recentPassedSubmissions: number;
    recentQuizAttempts: number;
  };
  intervention: LearningIntervention | null;
  rescueOffer: {
    title: string;
    description: string;
    target: number;
    current: number;
  };
  missions: RetentionMission[];
  incentives: RetentionIncentive[];
}

export async function fetchRetentionPlan(): Promise<RetentionPlan> {
  const { data } = await api.get<RetentionPlan>('/retention/plan');
  return data;
}
