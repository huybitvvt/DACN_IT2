export const COMPETITION_FORMULA_VERSION = 'COMPETITION_V2_1000';

export interface CompetitionScoreInput {
  completedLessons: number;
  passedExercises: number;
  quizBestPercents: number[];
  examEarned: number;
  examMax: number;
  activeDays: number;
  targetActiveDays: number;
}

export interface CompetitionScoreBreakdown {
  learning: number;
  practice: number;
  quizzes: number;
  contestRoom: number;
  consistency: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function targetActiveDays(startsAt: Date, endsAt: Date) {
  const durationDays = Math.max(1, Math.ceil((endsAt.getTime() - startsAt.getTime()) / 86_400_000));
  // Mục tiêu 3 ngày/tuần, tối thiểu 3 và tối đa 12 ngày để mùa dài không tạo lợi thế vô hạn.
  return clamp(Math.ceil((durationDays / 7) * 3), 3, 12);
}

export function calculateCompetitionScore(input: CompetitionScoreInput) {
  const breakdown: CompetitionScoreBreakdown = {
    // Chỉ LESSON được tính ở đây; exercise và quiz có nhóm riêng để tránh cộng trùng.
    learning: clamp(input.completedLessons * 20, 0, 200),
    // Mỗi exercise duy nhất chỉ cộng một lần.
    practice: clamp(input.passedExercises * 35, 0, 250),
    // Mỗi quiz dùng kết quả tốt nhất và có tối đa 30 điểm.
    quizzes: clamp(
      Math.round(
        input.quizBestPercents.reduce(
          (sum, percent) => sum + (clamp(percent, 0, 100) / 100) * 30,
          0,
        ),
      ),
      0,
      150,
    ),
    // Điểm phòng thi được chuẩn hóa về 300, không phụ thuộc tổng điểm admin cấu hình.
    contestRoom:
      input.examMax > 0 ? clamp(Math.round((input.examEarned / input.examMax) * 300), 0, 300) : 0,
    consistency:
      input.targetActiveDays > 0
        ? clamp(Math.round((input.activeDays / input.targetActiveDays) * 100), 0, 100)
        : 0,
  };

  return {
    score: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown,
    formulaVersion: COMPETITION_FORMULA_VERSION,
  };
}
