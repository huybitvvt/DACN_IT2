import { api } from './api';
import type { ProgrammingLanguage } from '@/types';

export interface LearningErrorProfile {
  summary: {
    totalSubmissions: number;
    passedSubmissions: number;
    failedSubmissions: number;
    passRate: number;
    recentPassRate: number;
    trendDelta: number;
  };
  categories: Array<{
    category: string;
    label: string;
    count: number;
    percent: number;
    recommendation: string;
  }>;
  languages: Array<{
    language: ProgrammingLanguage;
    total: number;
    passed: number;
    passRate: number;
  }>;
  recentErrors: Array<{
    id: string;
    category: string;
    label: string;
    createdAt: string;
    exercise: {
      id: string;
      title: string;
      language: ProgrammingLanguage;
      lesson: {
        title: string;
        course: { slug: string; title: string };
      };
    };
  }>;
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
  }>;
}

export async function fetchLearningErrorProfile() {
  const { data } = await api.get<LearningErrorProfile>('/learning/error-profile');
  return data;
}
