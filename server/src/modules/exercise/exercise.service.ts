import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { executeCode } from '../../services/codeRunner.js';
import { runOnClientNote } from './exercise.helpers.js';

// Chuẩn hoá output để so khớp: bỏ khoảng trắng cuối mỗi dòng và dòng trống cuối file.
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

// Lấy đề bài cho người học: KHÔNG trả input/expectedOutput của test case ẩn (Property 2).
export async function getExerciseForLearner(id: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      testCases: { orderBy: { order: 'asc' } },
    },
  });
  if (!exercise) {
    throw AppError.notFound('Không tìm thấy bài tập.');
  }

  return {
    id: exercise.id,
    lessonId: exercise.lessonId,
    title: exercise.title,
    promptMarkdown: exercise.promptMarkdown,
    language: exercise.language,
    starterCode: exercise.starterCode,
    // Chỉ trả test case công khai kèm dữ liệu; test ẩn chỉ báo số lượng.
    sampleTestCases: exercise.testCases
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
    hiddenTestCount: exercise.testCases.filter((tc) => tc.isHidden).length,
    runsOnClient: runOnClientNote(exercise.language),
  };
}

export interface TestCaseResult {
  index: number;
  passed: boolean;
  isHidden: boolean;
  // Chỉ lộ chi tiết với test case công khai.
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface GradeResult {
  passed: number;
  total: number;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  results: TestCaseResult[];
  compileError?: string;
}

// Chấm bài: chạy code với toàn bộ test case (gồm ẩn) qua Judge0 local.
// Server-side only — dùng cho C/C++/Python khi nộp bài.
export async function gradeSubmission(params: {
  exerciseId: string;
  sourceCode: string;
}): Promise<GradeResult> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: params.exerciseId },
    include: { testCases: { orderBy: { order: 'asc' } } },
  });
  if (!exercise) {
    throw AppError.notFound('Không tìm thấy bài tập.');
  }

  const testCases = exercise.testCases;
  if (testCases.length === 0) {
    throw AppError.badRequest('Bài tập này chưa có test case.');
  }

  const results: TestCaseResult[] = [];
  let passedCount = 0;
  let compileError: string | undefined;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const exec = await executeCode({
      language: exercise.language,
      sourceCode: params.sourceCode,
      stdin: tc.input,
    });

    // Với ngôn ngữ thông dịch như Python, lỗi cú pháp/runtime nằm trong stderr.
    // Dừng ngay để không chạy lặp cùng một lỗi cho các test còn lại.
    const executionError =
      exec.compileOutput || (exec.status !== 'Thành công' ? exec.stderr : '');
    if (executionError) {
      compileError = executionError;
      results.push({ index: i, passed: false, isHidden: tc.isHidden });
      break;
    }

    const actual = normalizeOutput(exec.stdout);
    const expected = normalizeOutput(tc.expectedOutput);
    const passed = actual === expected;
    if (passed) passedCount++;

    // Property 2: không lộ dữ liệu test ẩn.
    if (tc.isHidden) {
      results.push({ index: i, passed, isHidden: true });
    } else {
      results.push({
        index: i,
        passed,
        isHidden: false,
        input: tc.input,
        expectedOutput: expected,
        actualOutput: actual,
      });
    }
  }

  // Property 3: PASSED khi và chỉ khi tất cả test đều đạt.
  let status: GradeResult['status'];
  if (compileError) {
    status = 'ERROR';
  } else if (passedCount === testCases.length) {
    status = 'PASSED';
  } else {
    status = 'FAILED';
  }

  return {
    passed: passedCount,
    total: testCases.length,
    status,
    results,
    compileError,
  };
}
