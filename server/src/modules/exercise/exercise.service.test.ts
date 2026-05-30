import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma và codeRunner trước khi import service.
vi.mock('../../db/prisma.js', () => ({
  prisma: {
    exercise: { findUnique: vi.fn() },
  },
}));
vi.mock('../../services/codeRunner.js', () => ({
  executeCode: vi.fn(),
}));

import { prisma } from '../../db/prisma.js';
import { executeCode } from '../../services/codeRunner.js';
import { gradeSubmission, getExerciseForLearner, normalizeOutput } from './exercise.service.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedPrisma = prisma as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedExec = executeCode as any;

function exerciseWith(testCases: { input: string; expectedOutput: string; isHidden: boolean }[]) {
  return {
    id: 'ex1',
    lessonId: 'l1',
    title: 'T',
    promptMarkdown: 'P',
    language: 'PYTHON',
    starterCode: '',
    testCases: testCases.map((tc, i) => ({ ...tc, id: `tc${i}`, order: i, exerciseId: 'ex1' })),
  };
}

describe('normalizeOutput', () => {
  it('bỏ khoảng trắng cuối dòng và dòng trống cuối file', () => {
    expect(normalizeOutput('5  \n6\n\n')).toBe('5\n6');
    expect(normalizeOutput('hello\r\nworld')).toBe('hello\nworld');
  });
});

describe('gradeSubmission', () => {
  beforeEach(() => vi.clearAllMocks());

  it('PASSED khi và chỉ khi tất cả test đạt (Property 3)', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue(
      exerciseWith([
        { input: '2\n3', expectedOutput: '5', isHidden: false },
        { input: '10\n20', expectedOutput: '30', isHidden: true },
      ]),
    );
    mockedExec
      .mockResolvedValueOnce({ stdout: '5', stderr: '', compileOutput: '', status: 'ok', timeMs: null })
      .mockResolvedValueOnce({ stdout: '30', stderr: '', compileOutput: '', status: 'ok', timeMs: null });

    const result = await gradeSubmission({ exerciseId: 'ex1', sourceCode: 'x' });
    expect(result.status).toBe('PASSED');
    expect(result.passed).toBe(2);
    expect(result.total).toBe(2);
  });

  it('FAILED khi có ít nhất một test sai', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue(
      exerciseWith([
        { input: '2\n3', expectedOutput: '5', isHidden: false },
        { input: '10\n20', expectedOutput: '30', isHidden: true },
      ]),
    );
    mockedExec
      .mockResolvedValueOnce({ stdout: '5', stderr: '', compileOutput: '', status: 'ok', timeMs: null })
      .mockResolvedValueOnce({ stdout: '99', stderr: '', compileOutput: '', status: 'ok', timeMs: null });

    const result = await gradeSubmission({ exerciseId: 'ex1', sourceCode: 'x' });
    expect(result.status).toBe('FAILED');
    expect(result.passed).toBe(1);
  });

  it('KHÔNG lộ input/expectedOutput của test ẩn (Property 2)', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue(
      exerciseWith([
        { input: 'public-in', expectedOutput: 'pub', isHidden: false },
        { input: 'secret-in', expectedOutput: 'secret-out', isHidden: true },
      ]),
    );
    mockedExec
      .mockResolvedValueOnce({ stdout: 'pub', stderr: '', compileOutput: '', status: 'ok', timeMs: null })
      .mockResolvedValueOnce({ stdout: 'secret-out', stderr: '', compileOutput: '', status: 'ok', timeMs: null });

    const result = await gradeSubmission({ exerciseId: 'ex1', sourceCode: 'x' });
    const hidden = result.results.find((r) => r.isHidden)!;
    expect(hidden.input).toBeUndefined();
    expect(hidden.expectedOutput).toBeUndefined();
    expect(hidden.actualOutput).toBeUndefined();
    // Test công khai thì có chi tiết.
    const pub = result.results.find((r) => !r.isHidden)!;
    expect(pub.input).toBe('public-in');
  });

  it('ERROR khi lỗi biên dịch', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue(
      exerciseWith([{ input: '', expectedOutput: '5', isHidden: false }]),
    );
    mockedExec.mockResolvedValue({
      stdout: '',
      stderr: '',
      compileOutput: 'error: expected ;',
      status: 'compile error',
      timeMs: null,
    });

    const result = await gradeSubmission({ exerciseId: 'ex1', sourceCode: 'x' });
    expect(result.status).toBe('ERROR');
    expect(result.compileError).toContain('error');
  });
});

describe('getExerciseForLearner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chỉ trả test công khai, đếm số test ẩn (Property 2)', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue(
      exerciseWith([
        { input: 'a', expectedOutput: 'b', isHidden: false },
        { input: 'secret', expectedOutput: 'secret', isHidden: true },
        { input: 'secret2', expectedOutput: 'secret2', isHidden: true },
      ]),
    );
    const ex = await getExerciseForLearner('ex1');
    expect(ex.sampleTestCases).toHaveLength(1);
    expect(ex.hiddenTestCount).toBe(2);
    expect(JSON.stringify(ex)).not.toContain('secret');
  });
});
