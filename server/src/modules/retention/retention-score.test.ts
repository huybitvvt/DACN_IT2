import { describe, expect, it } from 'vitest';
import { calculateRetentionHealth } from './retention-score.js';

const stableInput = {
  daysInactive: 0,
  overallPercent: 55,
  effectiveStreak: 5,
  activeDays14: 7,
  completedItems14: 5,
  completedItemsPrevious14: 3,
  attemptedExercises14: 4,
  passedExercises14: 4,
  quizAttempts14: 3,
  averageQuizPercent14: 90,
  activityUnits7: 8,
  activityUnitsPrevious7: 6,
};

describe('calculateRetentionHealth V3', () => {
  it('xếp học viên đều và có chất lượng vào nhóm ổn định', () => {
    const result = calculateRetentionHealth(stableInput);
    expect(result.riskLevel).toBe('ON_TRACK');
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.factors.reduce((sum, factor) => sum + factor.maxScore, 0)).toBe(100);
  });

  it('không để tiến độ tích lũy che lấp 14 ngày không học', () => {
    const result = calculateRetentionHealth({
      ...stableInput,
      daysInactive: 15,
      overallPercent: 95,
      activeDays14: 0,
      completedItems14: 0,
      attemptedExercises14: 0,
      passedExercises14: 0,
      quizAttempts14: 0,
      averageQuizPercent14: 0,
      activityUnits7: 0,
    });
    expect(result.riskLevel).toBe('AT_RISK');
    expect(result.reasons.some((reason) => reason.includes('nguy cơ cao'))).toBe(true);
  });

  it('không tăng điểm mastery khi lặp lại cùng một bài', () => {
    const oneExercise = calculateRetentionHealth({
      ...stableInput,
      attemptedExercises14: 1,
      passedExercises14: 1,
    });
    const repeatedExercise = calculateRetentionHealth({
      ...stableInput,
      attemptedExercises14: 1,
      passedExercises14: 1,
    });
    expect(repeatedExercise.factors.find((factor) => factor.key === 'MASTERY')?.score).toBe(
      oneExercise.factors.find((factor) => factor.key === 'MASTERY')?.score,
    );
  });

  it('giới hạn mọi điểm trong 0..100', () => {
    const result = calculateRetentionHealth({
      ...stableInput,
      overallPercent: 100,
      activeDays14: 100,
      completedItems14: 100,
      attemptedExercises14: 100,
      passedExercises14: 100,
      quizAttempts14: 100,
      averageQuizPercent14: 1000,
      activityUnits7: 100,
    });
    expect(result.score).toBe(100);
  });
});
