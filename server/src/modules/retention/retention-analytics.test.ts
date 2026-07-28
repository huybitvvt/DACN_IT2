import { describe, expect, it } from 'vitest';
import { buildRetentionScoreInputAt, buildRetentionTrend } from './retention-analytics.js';

const day = (value: string) => new Date(`${value}T10:00:00.000Z`);

describe('retention analytics', () => {
  it('chỉ tính mỗi exercise một lần trong mastery', () => {
    const input = buildRetentionScoreInputAt(
      {
        totalItems: 10,
        lastActiveDate: day('2026-07-28'),
        progress: [],
        submissions: [
          { exerciseId: 'e1', status: 'FAILED', createdAt: day('2026-07-27') },
          { exerciseId: 'e1', status: 'PASSED', createdAt: day('2026-07-28') },
          { exerciseId: 'e1', status: 'PASSED', createdAt: day('2026-07-28') },
        ],
        quizAttempts: [],
      },
      day('2026-07-28'),
    );
    expect(input.attemptedExercises14).toBe(1);
    expect(input.passedExercises14).toBe(1);
  });

  it('tạo đủ chuỗi 28 ngày và tính delta 7 ngày', () => {
    const trend = buildRetentionTrend(
      {
        totalItems: 10,
        lastActiveDate: day('2026-07-28'),
        progress: [
          { itemType: 'LESSON', completedAt: day('2026-07-26') },
          { itemType: 'LESSON', completedAt: day('2026-07-28') },
        ],
        submissions: [{ exerciseId: 'e1', status: 'PASSED', createdAt: day('2026-07-28') }],
        quizAttempts: [{ quizId: 'q1', score: 8, total: 10, createdAt: day('2026-07-28') }],
      },
      day('2026-07-28'),
    );
    expect(trend.points).toHaveLength(28);
    expect(trend.points.at(-1)?.score).toBeGreaterThan(trend.points[0].score);
    expect(trend.summary.delta7d).toBeGreaterThan(0);
  });
});
