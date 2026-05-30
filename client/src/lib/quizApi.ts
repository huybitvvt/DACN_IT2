import { api } from './api';

export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'SINGLE' | 'MULTI';
  choices: QuizChoice[];
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizCorrection {
  questionId: string;
  correct: boolean;
  correctChoiceIds: string[];
}

export interface QuizResult {
  score: number;
  total: number;
  corrections: QuizCorrection[];
  saved: boolean;
}

export async function fetchQuiz(lessonId: string): Promise<Quiz> {
  const { data } = await api.get<{ quiz: Quiz }>(`/lessons/${lessonId}/quiz`);
  return data.quiz;
}

export interface AnswerInput {
  questionId: string;
  choiceIds: string[];
}

export async function submitQuiz(quizId: string, answers: AnswerInput[]): Promise<QuizResult> {
  const { data } = await api.post<QuizResult>(`/quizzes/${quizId}/submit`, { answers });
  return data;
}
