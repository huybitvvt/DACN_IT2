import { prisma } from '../../db/prisma.js';

// Tạo embeddings cục bộ bằng Transformers.js (model all-MiniLM-L6-v2, 384 chiều).
// Miễn phí, chạy offline, không cần API key.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embedderPromise: Promise<any> | null = null;

export function isSemanticRagEnabled(): boolean {
  return process.env.ENABLE_SEMANTIC_RAG === 'true';
}

async function getEmbedder() {
  if (!embedderPromise) {
    const { pipeline } = await import('@xenova/transformers');
    // Model đa ngôn ngữ — hỗ trợ tiếng Việt tốt hơn all-MiniLM (vốn thiên tiếng Anh).
    embedderPromise = pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    );
  }
  return embedderPromise;
}

// Tạo vector embedding cho một đoạn văn bản.
export async function embed(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  const output = await embedder(text.slice(0, 2000), { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

// Cosine similarity giữa 2 vector (đã normalize nên chỉ cần tích vô hướng).
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

// Tạo & lưu embedding cho tất cả bài học chưa có (gọi khi seed hoặc lúc khởi động).
export async function backfillLessonEmbeddings(): Promise<number> {
  if (!isSemanticRagEnabled()) {
    return 0;
  }

  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true, contentMarkdown: true, embedding: true },
  });
  let count = 0;
  for (const lesson of lessons) {
    if (lesson.embedding != null) continue; // đã có embedding
    const vec = await embed(`${lesson.title}\n${lesson.contentMarkdown}`);
    await prisma.lesson.update({ where: { id: lesson.id }, data: { embedding: vec } });
    count++;
  }
  return count;
}

export interface SemanticHit {
  id: string;
  title: string;
  courseTitle: string;
  contentMarkdown: string;
  score: number;
}

// Tìm top-k bài học gần nghĩa nhất với câu hỏi (dùng cosine similarity).
export async function semanticSearch(question: string, k = 3): Promise<SemanticHit[]> {
  if (!isSemanticRagEnabled()) {
    return [];
  }

  const queryVec = await embed(question);

  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      title: true,
      contentMarkdown: true,
      embedding: true,
      course: { select: { title: true } },
    },
  });

  const scored = lessons
    .filter((l) => l.embedding != null)
    .map((l) => ({
      id: l.id,
      title: l.title,
      courseTitle: l.course.title,
      contentMarkdown: l.contentMarkdown,
      score: cosineSim(queryVec, (l.embedding as number[]) ?? []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  // Ngưỡng tối thiểu để loại kết quả quá lạc đề.
  return scored.filter((s) => s.score > 0.2);
}
