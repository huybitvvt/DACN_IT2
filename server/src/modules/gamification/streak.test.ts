import { describe, it, expect } from 'vitest';
import { computeStreak } from './streak.js';

function d(iso: string): Date {
  return new Date(iso + 'T10:00:00Z');
}

describe('computeStreak - Property 7', () => {
  it('lần đầu hoạt động -> streak = 1', () => {
    const r = computeStreak({ streakCount: 0, lastActiveDate: null }, d('2026-05-30'));
    expect(r.streakCount).toBe(1);
  });

  it('hoạt động cùng ngày -> giữ nguyên', () => {
    const r = computeStreak(
      { streakCount: 3, lastActiveDate: d('2026-05-30') },
      new Date('2026-05-30T20:00:00Z'),
    );
    expect(r.streakCount).toBe(3);
  });

  it('ngày kế tiếp -> tăng 1', () => {
    const r = computeStreak({ streakCount: 3, lastActiveDate: d('2026-05-30') }, d('2026-05-31'));
    expect(r.streakCount).toBe(4);
  });

  it('cách hơn 1 ngày -> reset về 1', () => {
    const r = computeStreak({ streakCount: 10, lastActiveDate: d('2026-05-30') }, d('2026-06-02'));
    expect(r.streakCount).toBe(1);
  });

  it('streak tăng tối đa 1 mỗi ngày (không nhảy vọt)', () => {
    let state = { streakCount: 0, lastActiveDate: null as Date | null };
    state = computeStreak(state, d('2026-05-01'));
    state = computeStreak(state, d('2026-05-02'));
    state = computeStreak(state, d('2026-05-03'));
    expect(state.streakCount).toBe(3);
  });
});
