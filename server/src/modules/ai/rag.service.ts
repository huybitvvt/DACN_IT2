import { prisma } from '../../db/prisma.js';

export interface RetrievedLesson {
  id: string;
  title: string;
  courseTitle: string;
  contentMarkdown: string;
  rank: number;
}

// Chuyển câu hỏi người dùng thành chuỗi tsquery dạng OR giữa các từ.
// Dùng config 'simple' để không phụ thuộc ngôn ngữ (phù hợp tiếng Việt + code).
function buildTsQuery(question: string): string {
  const tokens = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 12);
  // Loại trùng và nối bằng OR.
  return [...new Set(tokens)].map((t) => t.replace(/'/g, "''")).join(' | ');
}

// Truy xuất top-k bài học liên quan tới câu hỏi bằng full-text search.
export async function retrieveRelevantLessons(
  question: string,
  k = 3,
): Promise<RetrievedLesson[]> {
  const tsquery = buildTsQuery(question);
  if (!tsquery) return [];

  // Tìm theo tiêu đề + nội dung; xếp hạng bằng ts_rank.
  const rows = await prisma.$queryRawUnsafe<RetrievedLesson[]>(
    `
    SELECT l.id,
           l.title,
           c.title AS "courseTitle",
           l."contentMarkdown",
           ts_rank(
             to_tsvector('simple', l.title || ' ' || l."contentMarkdown"),
             to_tsquery('simple', $1)
           ) AS rank
    FROM "Lesson" l
    JOIN "Course" c ON c.id = l."courseId"
    WHERE to_tsvector('simple', l.title || ' ' || l."contentMarkdown")
          @@ to_tsquery('simple', $1)
    ORDER BY rank DESC
    LIMIT $2;
    `,
    tsquery,
    k,
  );

  return rows;
}

// Ghép ngữ cảnh từ các bài học truy xuất được, kèm nguồn để AI dẫn chiếu.
export function buildContext(lessons: RetrievedLesson[]): string {
  if (lessons.length === 0) return '';
  return lessons
    .map(
      (l, i) =>
        `[Nguồn ${i + 1}: ${l.courseTitle} - ${l.title}]\n${l.contentMarkdown.slice(0, 1500)}`,
    )
    .join('\n\n---\n\n');
}

// Kiểm tra câu hỏi có chứa từ khoá lập trình liên quan phạm vi không.
// Dùng làm guardrail phụ phía backend (giảm gọi API cho câu hỏi rõ ràng lạc đề).
const SCOPE_KEYWORDS = [
  'sql',
  'select',
  'database',
  'query',
  'truy vấn',
  'c++',
  'cpp',
  'python',
  'lập trình',
  'code',
  'biến',
  'hàm',
  'vòng lặp',
  'mảng',
  'con trỏ',
  'lỗi',
  'error',
  'compile',
  'biên dịch',
  'class',
  'function',
  'loop',
  'array',
  'pointer',
  'in ra',
  'print',
];

export function looksInScope(question: string): boolean {
  const q = question.toLowerCase();
  return SCOPE_KEYWORDS.some((kw) => q.includes(kw));
}
