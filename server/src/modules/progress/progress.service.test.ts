import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/prisma.js', () => ({
  prisma: {
    course: { findMany: vi.fn() },
    lesson: { findMany: vi.fn() },
    progress: { count: vi.fn(), upsert: vi.fn() },
  },
}));

import { prisma } from '../../db/prisma.js';
import { getProgressOverview, markCompleted } from './progress.service.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedPrisma = prisma as any;

describe('getProgressOverview - Property 5 (percent trong [0,100])', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tính percent = completed/total*100', async () => {
    mockedPrisma.course.findMany.mockResolvedValue([
      { id: 'c1', slug: 'python', title: 'Python', order: 1 },
    ]);
    // 1 lesson có 1 exercise + quiz => total = 3
    mockedPrisma.lesson.findMany.mockResolvedValue([
      { _count: { exercises: 1 }, quiz: { id: 'q1' } },
    ]);
    mockedPrisma.progress.count.mockResolvedValue(3);

    const result = await getProgressOverview('u1');
    expect(result[0].total).toBe(3);
    expect(result[0].completed).toBe(3);
    expect(result[0].percent).toBe(100);
  });

  it('percent không vượt 100 và không âm', async () => {
    mockedPrisma.course.findMany.mockResolvedValue([
      { id: 'c1', slug: 'python', title: 'Python', order: 1 },
    ]);
    mockedPrisma.lesson.findMany.mockResolvedValue([{ _count: { exercises: 0 }, quiz: null }]);
    // total = 1, nhưng completed lỡ = 5 (dữ liệu bất thường) -> kẹp về 1 và 100%
    mockedPrisma.progress.count.mockResolvedValue(5);

    const result = await getProgressOverview('u1');
    expect(result[0].percent).toBeLessThanOrEqual(100);
    expect(result[0].percent).toBeGreaterThanOrEqual(0);
    expect(result[0].completed).toBeLessThanOrEqual(result[0].total);
  });

  it('khoá không có item -> percent = 0', async () => {
    mockedPrisma.course.findMany.mockResolvedValue([
      { id: 'c1', slug: 'empty', title: 'Empty', order: 1 },
    ]);
    mockedPrisma.lesson.findMany.mockResolvedValue([]);
    mockedPrisma.progress.count.mockResolvedValue(0);

    const result = await getProgressOverview('u1');
    expect(result[0].total).toBe(0);
    expect(result[0].percent).toBe(0);
  });
});

describe('markCompleted - Property 6 (tính đơn điệu)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dùng upsert với completed=true ở cả create lẫn update', async () => {
    mockedPrisma.progress.upsert.mockResolvedValue({});
    await markCompleted({ userId: 'u1', courseId: 'c1', itemType: 'LESSON', itemId: 'l1' });

    const arg = mockedPrisma.progress.upsert.mock.calls[0][0];
    expect(arg.update.completed).toBe(true);
    expect(arg.create.completed).toBe(true);
  });
});
