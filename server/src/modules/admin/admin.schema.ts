import { z } from 'zod';

const language = z.enum(['SQL', 'C', 'CPP', 'PYTHON']);

export const courseSchema = z.object({
  slug: z.string().min(1).max(60),
  title: z.string().min(1).max(200),
  language,
  description: z.string().max(1000).default(''),
  order: z.number().int().min(0).default(0),
});

export const lessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  contentMarkdown: z.string().default(''),
  order: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(true),
});

export const testCaseSchema = z.object({
  input: z.string().default(''),
  expectedOutput: z.string().default(''),
  isHidden: z.boolean().default(false),
});

export const exerciseSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1).max(200),
  promptMarkdown: z.string().default(''),
  language,
  starterCode: z.string().default(''),
  order: z.number().int().min(0).default(0),
  testCases: z.array(testCaseSchema).default([]),
});

export const choiceSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['SINGLE', 'MULTI']).default('SINGLE'),
  choices: z.array(choiceSchema).min(2),
});

export const quizSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1).max(200),
  questions: z.array(questionSchema).default([]),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
