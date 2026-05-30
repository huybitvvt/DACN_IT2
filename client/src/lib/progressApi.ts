import { api } from './api';

export interface CourseProgress {
  courseId: string;
  slug: string;
  title: string;
  completed: number;
  total: number;
  percent: number;
}

export interface ProgressOverview {
  courses: CourseProgress[];
  completedItemIds: string[];
}

export async function fetchProgress(): Promise<ProgressOverview> {
  const { data } = await api.get<ProgressOverview>('/progress');
  return data;
}

export interface CompletePayload {
  type: 'LESSON' | 'EXERCISE' | 'QUIZ';
  refId: string;
  lessonId?: string;
}

export async function completeItem(payload: CompletePayload): Promise<void> {
  await api.post('/progress/complete', payload);
}
