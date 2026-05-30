import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/prisma.js', () => ({
  prisma: { quiz: { findUnique: vi.fn() } },
}));

import { prisma } from '../../db/prisma.js';
import { gradeQuiz } from './quiz.service.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedPrisma = prisma as any;

function quiz() {
  return {
    id: 'q1',
    questions: [
      {
        id: 'qa',
        choices: [
          { id: 'a1', isCorrect: true },
          { id: 'a2', isCorrect: false },
        ],
      },
      {
        id: 'qb',
        choices: [
          { id: 'b1', isCorrect: true },
          { id: 'b2', isCorrect: true },
          { id: 'b3', isCorrect: false },
        ],
      },
    ],
  };
}

describe('gradeQuiz', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chấm đúng câu SINGLE và MULTI khi trùng khớp hoàn toàn', async () => {
    mockedPrisma.quiz.findUnique.mockResolvedValue(quiz());
    const result = await gradeQuiz('q1', [
      { questionId: 'qa', choiceIds: ['a1'] },
      { questionId: 'qb', choiceIds: ['b1', 'b2'] },
    ]);
    expect(result.score).toBe(2);
    expect(result.total).toBe(2);
  });

  it('câu MULTI thiếu một đáp án đúng -> sai', async () => {
    mockedPrisma.quiz.findUnique.mockResolvedValue(quiz());
    const result = await gradeQuiz('q1', [
      { questionId: 'qa', choiceIds: ['a1'] },
      { questionId: 'qb', choiceIds: ['b1'] },
    ]);
    expect(result.score).toBe(1);
    const qb = result.corrections.find((c) => c.questionId === 'qb')!;
    expect(qb.correct).toBe(false);
    expect(qb.correctChoiceIds.sort()).toEqual(['b1', 'b2']);
  });

  it('chọn dư đáp án -> sai', async () => {
    mockedPrisma.quiz.findUnique.mockResolvedValue(quiz());
    const result = await gradeQuiz('q1', [
      { questionId: 'qa', choiceIds: ['a1', 'a2'] },
      { questionId: 'qb', choiceIds: ['b1', 'b2'] },
    ]);
    expect(result.score).toBe(1);
  });

  it('không trả lời -> sai', async () => {
    mockedPrisma.quiz.findUnique.mockResolvedValue(quiz());
    const result = await gradeQuiz('q1', []);
    expect(result.score).toBe(0);
  });
});
