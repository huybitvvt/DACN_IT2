import { api } from './api';
import type { ProgrammingLanguage } from '@/types';

export interface SampleTestCase {
  input: string;
  expectedOutput: string;
}

export interface ExerciseDetail {
  id: string;
  lessonId: string;
  title: string;
  promptMarkdown: string;
  language: ProgrammingLanguage;
  starterCode: string;
  sampleTestCases: SampleTestCase[];
  hiddenTestCount: number;
  runsOnClient: boolean;
}

export interface TestCaseResult {
  index: number;
  passed: boolean;
  isHidden: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface SubmitResult {
  passed: number;
  total: number;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  results: TestCaseResult[];
  compileError?: string;
  saved: boolean;
}

export async function fetchExercise(id: string): Promise<ExerciseDetail> {
  const { data } = await api.get<{ exercise: ExerciseDetail }>(`/exercises/${id}`);
  return data.exercise;
}

export async function submitExercise(id: string, sourceCode: string): Promise<SubmitResult> {
  const { data } = await api.post<SubmitResult>(`/exercises/${id}/submit`, { sourceCode });
  return data;
}
