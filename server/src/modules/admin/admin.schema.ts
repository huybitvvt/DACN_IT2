import { z } from 'zod';

const language = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9+#._-]+$/, 'Mã ngôn ngữ chỉ gồm chữ, số và các ký tự + # . _ -')
  .transform((value) => value.toUpperCase());

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

export const contestRewardSchema = z.object({
  rankFrom: z.number().int().min(1),
  rankTo: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  rewardType: z.enum(['TUITION_REFUND', 'VOUCHER', 'BADGE', 'UNLOCK']).default('BADGE'),
  valueVnd: z.number().int().min(0).nullable().optional(),
  percentOff: z.number().int().min(0).max(100).nullable().optional(),
});

export const contestProblemSchema = z.object({
  problemType: z.enum(['EXERCISE', 'QUIZ']),
  exerciseId: z.string().nullable().optional(),
  quizId: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  points: z.number().int().min(1).max(1000).default(100),
  order: z.number().int().min(0).default(0),
});

export const contestSchema = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().max(1200).default(''),
  status: z.enum(['UPCOMING', 'ACTIVE', 'FINISHED']).default('ACTIVE'),
  courseSlug: z.string().max(80).nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  durationMinutes: z.number().int().min(5).max(360).default(60),
  scoringNote: z.string().max(1200).default(''),
  rewards: z.array(contestRewardSchema).default([]),
  problems: z.array(contestProblemSchema).default([]),
});

export const rewardClaimStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  note: z.string().max(1000).default(''),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type ContestInput = z.infer<typeof contestSchema>;
export type RewardClaimStatusInput = z.infer<typeof rewardClaimStatusSchema>;
