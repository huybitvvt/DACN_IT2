import { prisma } from '../../db/prisma.js';
import type { GradeResult } from '../exercise/exercise.service.js';

type ProgrammingLanguage = string;

export interface SubmissionDiagnostic {
  errorCategory: string | null;
  errorFingerprint: string | null;
  errorSummary: string | null;
}

const categoryInfo: Record<string, { label: string; recommendation: string }> = {
  SYNTAX: {
    label: 'Cú pháp',
    recommendation: 'Đọc dòng lỗi đầu tiên, kiểm tra dấu ngoặc, dấu chấm phẩy và thụt lề.',
  },
  UNDECLARED_IDENTIFIER: {
    label: 'Biến hoặc hàm chưa khai báo',
    recommendation: 'Kiểm tra phạm vi biến, chính tả tên và thứ tự khai báo hàm.',
  },
  TYPE_MISMATCH: {
    label: 'Kiểu dữ liệu',
    recommendation: 'Đối chiếu kiểu của biến, tham số, giá trị trả về và phép chuyển đổi.',
  },
  IMPORT_OR_HEADER: {
    label: 'Thư viện hoặc header',
    recommendation: 'Kiểm tra tên module, header và thư viện được Judge0 hỗ trợ.',
  },
  POINTER_OR_MEMORY: {
    label: 'Con trỏ hoặc bộ nhớ',
    recommendation: 'Kiểm tra con trỏ null, cấp phát, chỉ số mảng và vùng nhớ đã giải phóng.',
  },
  OUTPUT_FORMAT: {
    label: 'Định dạng đầu ra',
    recommendation: 'So sánh chính xác khoảng trắng, xuống dòng và thứ tự dữ liệu với đề bài.',
  },
  PARTIAL_SOLUTION: {
    label: 'Thuật toán chưa bao phủ hết',
    recommendation: 'Xem lại trường hợp biên và các test đã pass để tìm nhánh logic còn thiếu.',
  },
  WRONG_OUTPUT: {
    label: 'Kết quả sai',
    recommendation: 'Chạy lại với test mẫu nhỏ, ghi từng bước biến trung gian để tìm sai lệch.',
  },
  COMPILE_ERROR: {
    label: 'Lỗi biên dịch',
    recommendation: 'Sửa lỗi biên dịch đầu tiên trước; các lỗi phía sau thường là lỗi dây chuyền.',
  },
};

function detectCompileCategory(message: string, sourceCode: string) {
  const normalized = message.toLowerCase();
  if (/undeclared|not declared|not defined|nameerror|cannot find symbol/.test(normalized)) {
    return 'UNDECLARED_IDENTIFIER';
  }
  if (
    /typeerror|incompatible type|cannot convert|invalid conversion|mismatched types/.test(
      normalized,
    )
  ) {
    return 'TYPE_MISMATCH';
  }
  if (/no such file|modulenotfound|importerror|cannot find module|header/.test(normalized)) {
    return 'IMPORT_OR_HEADER';
  }
  if (/pointer|nullptr|null pointer|segmentation|memory|out of bounds/.test(normalized)) {
    return 'POINTER_OR_MEMORY';
  }
  if (/syntaxerror|invalid syntax|expected|unexpected token|indentationerror/.test(normalized)) {
    return 'SYNTAX';
  }
  if (/[*&]\s*[a-z_]/i.test(sourceCode) && /error/.test(normalized)) return 'POINTER_OR_MEMORY';
  return 'COMPILE_ERROR';
}

export function classifySubmissionError(params: {
  language: ProgrammingLanguage;
  sourceCode: string;
  grade: GradeResult;
}): SubmissionDiagnostic {
  if (params.grade.status === 'PASSED') {
    return { errorCategory: null, errorFingerprint: null, errorSummary: null };
  }

  let category: string;
  if (params.grade.status === 'ERROR') {
    category = detectCompileCategory(params.grade.compileError ?? '', params.sourceCode);
  } else if (params.grade.passed > 0) {
    category = 'PARTIAL_SOLUTION';
  } else {
    const publicFailures = params.grade.results.filter(
      (result) => !result.isHidden && !result.passed,
    );
    category = publicFailures.some(
      (result) =>
        result.actualOutput !== undefined &&
        result.expectedOutput !== undefined &&
        result.actualOutput.trim() === result.expectedOutput.trim() &&
        result.actualOutput !== result.expectedOutput,
    )
      ? 'OUTPUT_FORMAT'
      : 'WRONG_OUTPUT';
  }

  const info = categoryInfo[category] ?? categoryInfo.COMPILE_ERROR;
  return {
    errorCategory: category,
    errorFingerprint: `${params.language}:${category}`,
    errorSummary: info.label,
  };
}

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export async function getLearningErrorProfile(userId: string) {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: {
      exercise: {
        select: {
          id: true,
          title: true,
          language: true,
          lesson: {
            select: {
              title: true,
              course: { select: { slug: true, title: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const failed = submissions.filter((submission) => submission.status !== 'PASSED');
  const byCategory = new Map<string, number>();
  const byLanguage = new Map<string, { total: number; passed: number }>();

  for (const submission of submissions) {
    const language = submission.exercise.language;
    const languageRow = byLanguage.get(language) ?? { total: 0, passed: 0 };
    languageRow.total++;
    if (submission.status === 'PASSED') languageRow.passed++;
    byLanguage.set(language, languageRow);
    if (submission.errorCategory) {
      byCategory.set(submission.errorCategory, (byCategory.get(submission.errorCategory) ?? 0) + 1);
    }
  }

  const categories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: categoryInfo[category]?.label ?? category,
      count,
      percent: percent(count, failed.length),
      recommendation:
        categoryInfo[category]?.recommendation ?? 'Xem lại lời giải và thử với test nhỏ hơn.',
    }));
  const recent = submissions.slice(0, 20);
  const previous = submissions.slice(20, 40);
  const recentPassRate = percent(
    recent.filter((submission) => submission.status === 'PASSED').length,
    recent.length,
  );
  const previousPassRate = percent(
    previous.filter((submission) => submission.status === 'PASSED').length,
    previous.length,
  );

  return {
    summary: {
      totalSubmissions: submissions.length,
      passedSubmissions: submissions.filter((submission) => submission.status === 'PASSED').length,
      failedSubmissions: failed.length,
      passRate: percent(
        submissions.filter((submission) => submission.status === 'PASSED').length,
        submissions.length,
      ),
      recentPassRate,
      trendDelta: recentPassRate - previousPassRate,
    },
    categories,
    languages: [...byLanguage.entries()].map(([language, row]) => ({
      language,
      total: row.total,
      passed: row.passed,
      passRate: percent(row.passed, row.total),
    })),
    recentErrors: failed.slice(0, 12).map((submission) => ({
      id: submission.id,
      category: submission.errorCategory ?? 'UNCLASSIFIED',
      label: submission.errorSummary ?? 'Chưa phân loại',
      createdAt: submission.createdAt,
      exercise: submission.exercise,
    })),
    recommendations: categories.slice(0, 3).map((category) => ({
      category: category.category,
      title: `Ưu tiên sửa: ${category.label}`,
      description: category.recommendation,
    })),
  };
}
