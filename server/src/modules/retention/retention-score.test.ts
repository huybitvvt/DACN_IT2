import { describe, expect, it } from 'vitest';
import { calculateRetentionHealth } from './retention-score.js';

describe('calculateRetentionHealth', () => {
  it('giải thích rõ trường hợp nguy cơ cao', () => {
    const result = calculateRetentionHealth({
      daysInactive: 10,
      overallPercent: 10,
      streak: 0,
      recentPassedSubmissions: 0,
      recentQuizAttempts: 0,
      badges: 0,
    });
    expect(result.riskLevel).toBe('AT_RISK');
    expect(result.score).toBeLessThan(45);
    expect(result.reasons).toContain('Không có bài code pass hoặc quiz trong 7 ngày gần đây.');
    expect(result.factors.reduce((sum, factor) => sum + factor.maxScore, 0)).toBe(100);
  });

  it('giới hạn điểm trong 0..100', () => {
    const result = calculateRetentionHealth({
      daysInactive: 0,
      overallPercent: 100,
      streak: 100,
      recentPassedSubmissions: 100,
      recentQuizAttempts: 100,
      badges: 100,
    });
    expect(result.score).toBe(100);
    expect(result.riskLevel).toBe('ON_TRACK');
  });
});
