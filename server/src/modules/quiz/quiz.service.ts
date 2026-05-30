import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';

// Lấy quiz của một bài học để người học làm.
// KHÔNG trả trường isCorrect của lựa chọn (tránh lộ đáp án).
export async function getQuizForLesson(lessonId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          choices: {
            orderBy: { order: 'asc' },
            select: { id: true, text: true },
          },
        },
      },
    },
  });
  if (!quiz) {
    throw AppError.notFound('Bài học này chưa có quiz.');
  }

  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    title: quiz.title,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      choices: q.choices,
    })),
  };
}

export interface QuizAnswer {
  questionId: string;
  choiceIds: string[];
}

export interface QuizCorrection {
  questionId: string;
  correct: boolean;
  correctChoiceIds: string[];
}

export interface QuizGradeResult {
  score: number;
  total: number;
  corrections: QuizCorrection[];
}

// Chấm quiz: một câu đúng khi tập lựa chọn người dùng chọn TRÙNG KHỚP
// với tập đáp án đúng (đúng cho cả SINGLE và MULTI).
export async function gradeQuiz(
  quizId: string,
  answers: QuizAnswer[],
): Promise<QuizGradeResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { choices: true } } },
  });
  if (!quiz) {
    throw AppError.notFound('Không tìm thấy quiz.');
  }

  const answerMap = new Map(answers.map((a) => [a.questionId, new Set(a.choiceIds)]));
  const corrections: QuizCorrection[] = [];
  let score = 0;

  for (const q of quiz.questions) {
    const correctIds = q.choices.filter((c) => c.isCorrect).map((c) => c.id);
    const correctSet = new Set(correctIds);
    const userSet = answerMap.get(q.id) ?? new Set<string>();

    // Trùng khớp hoàn toàn: cùng kích thước và mọi phần tử có trong tập đúng.
    const correct =
      userSet.size === correctSet.size && [...userSet].every((id) => correctSet.has(id));
    if (correct) score++;

    corrections.push({ questionId: q.id, correct, correctChoiceIds: correctIds });
  }

  return { score, total: quiz.questions.length, corrections };
}
