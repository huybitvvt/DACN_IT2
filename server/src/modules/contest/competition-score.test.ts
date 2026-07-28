import { describe, expect, it } from 'vitest';
import { calculateCompetitionScore, targetActiveDays } from './competition-score.js';

describe('competition score V2', () => {
  it('có tổng điểm tối đa 1000', () => {
    const result = calculateCompetitionScore({
      completedLessons: 100,
      passedExercises: 100,
      quizBestPercents: Array.from({ length: 20 }, () => 100),
      examEarned: 100,
      examMax: 100,
      activeDays: 100,
      targetActiveDays: 12,
    });
    expect(result.score).toBe(1000);
    expect(Object.values(result.breakdown).reduce((sum, value) => sum + value, 0)).toBe(1000);
  });

  it('không cho một loại hoạt động vượt trần', () => {
    const result = calculateCompetitionScore({
      completedLessons: 1000,
      passedExercises: 0,
      quizBestPercents: [],
      examEarned: 0,
      examMax: 0,
      activeDays: 0,
      targetActiveDays: 6,
    });
    expect(result.score).toBe(200);
    expect(result.breakdown.learning).toBe(200);
  });

  it('đặt mục tiêu độ đều theo 3 ngày mỗi tuần', () => {
    expect(targetActiveDays(new Date('2026-07-01'), new Date('2026-07-28'))).toBe(12);
    expect(targetActiveDays(new Date('2026-07-01'), new Date('2026-07-07'))).toBe(3);
  });
});
