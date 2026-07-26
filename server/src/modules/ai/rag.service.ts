import { prisma } from '../../db/prisma.js';
import { semanticSearch } from './embedding.service.js';

export interface RetrievedLesson {
  id: string;
  title: string;
  courseTitle: string;
  contentMarkdown: string;
  rank: number;
}

const FOCUS_STOP_WORDS = new Set([
  'các',
  'cho',
  'của',
  'được',
  'giải',
  'là',
  'một',
  'này',
  'như',
  'thế',
  'trong',
  'và',
  'về',
]);

function focusTokens(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_+#]/gu, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 2 && !FOCUS_STOP_WORDS.has(token)),
    ),
  ];
}

// Chọn đoạn trong bài học có nhiều từ khóa trùng với câu hỏi. Cách này vừa
// giảm prompt vừa tránh việc luôn lấy phần mở đầu dù câu hỏi nằm cuối bài.
export function focusLessonContent(
  contentMarkdown: string,
  question: string,
  maxChars = 700,
): string {
  if (contentMarkdown.length <= maxChars) return contentMarkdown;

  const queryTokens = focusTokens(question);
  const paragraphs = contentMarkdown
    .split(/\n{2,}/)
    .flatMap((paragraph) => {
      if (paragraph.length <= maxChars) return [paragraph];
      const chunks: string[] = [];
      for (let start = 0; start < paragraph.length; start += maxChars) {
        chunks.push(paragraph.slice(start, start + maxChars));
      }
      return chunks;
    })
    .filter(Boolean);

  if (queryTokens.length === 0 || paragraphs.length === 0) {
    return contentMarkdown.slice(0, maxChars);
  }

  const best = paragraphs.reduce(
    (current, paragraph) => {
      const normalized = paragraph.toLowerCase();
      const score = queryTokens.reduce(
        (total, token) => total + (normalized.includes(token) ? 1 : 0),
        0,
      );
      return score > current.score ? { paragraph, score } : current;
    },
    { paragraph: paragraphs[0], score: -1 },
  );

  return best.paragraph.slice(0, maxChars);
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

// Truy xuất top-k bài học liên quan tới câu hỏi.
// Ưu tiên tìm kiếm ngữ nghĩa (vector embeddings); nếu lỗi/không có kết quả thì
// fallback về full-text search của PostgreSQL.
export async function retrieveRelevantLessons(
  question: string,
  k = 3,
): Promise<RetrievedLesson[]> {
  // 1) Thử semantic search bằng embeddings.
  try {
    const hits = await semanticSearch(question, k);
    if (hits.length > 0) {
      return hits.map((h) => ({
        id: h.id,
        title: h.title,
        courseTitle: h.courseTitle,
        contentMarkdown: h.contentMarkdown,
        rank: h.score,
      }));
    }
  } catch (err) {
    console.warn('[RAG] semantic search lỗi, fallback full-text:', err);
  }

  // 2) Fallback: full-text search.
  return fullTextSearch(question, k);
}

// Full-text search bằng PostgreSQL tsvector/tsquery.
async function fullTextSearch(question: string, k: number): Promise<RetrievedLesson[]> {
  const tsquery = buildTsQuery(question);
  if (!tsquery) return [];

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
export function buildContext(
  lessons: RetrievedLesson[],
  question = '',
  maxCharsPerLesson = 700,
): string {
  if (lessons.length === 0) return '';
  return lessons
    .map(
      (l, i) =>
        `[Nguồn ${i + 1}: ${l.courseTitle} - ${l.title}]\n${focusLessonContent(
          l.contentMarkdown,
          question,
          maxCharsPerLesson,
        )}`,
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
