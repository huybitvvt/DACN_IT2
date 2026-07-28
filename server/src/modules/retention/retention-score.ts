export type LearnerRiskLevel = 'ON_TRACK' | 'WATCH' | 'AT_RISK';

export interface RetentionScoreInput {
  daysInactive: number;
  overallPercent: number;
  effectiveStreak: number;
  activeDays14: number;
  completedItems14: number;
  completedItemsPrevious14: number;
  attemptedExercises14: number;
  passedExercises14: number;
  quizAttempts14: number;
  averageQuizPercent14: number;
  activityUnits7: number;
  activityUnitsPrevious7: number;
}

export interface RetentionScoreFactor {
  key: 'RECENCY' | 'CONSISTENCY' | 'PROGRESS' | 'MASTERY' | 'MOMENTUM';
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function recencyScore(daysInactive: number) {
  if (daysInactive <= 0) return 25;
  if (daysInactive === 1) return 23;
  if (daysInactive === 2) return 20;
  if (daysInactive === 3) return 17;
  if (daysInactive <= 5) return 13;
  if (daysInactive <= 7) return 9;
  if (daysInactive <= 14) return 4;
  return 0;
}

export function riskFromHealthScore(score: number, daysInactive = 0): LearnerRiskLevel {
  // Điểm tích lũy cũ không được che lấp tín hiệu nghỉ học kéo dài.
  if (daysInactive >= 14) return 'AT_RISK';
  if (daysInactive >= 7) return score >= 45 ? 'WATCH' : 'AT_RISK';
  if (score >= 70) return 'ON_TRACK';
  if (score >= 45) return 'WATCH';
  return 'AT_RISK';
}

export function calculateRetentionHealth(input: RetentionScoreInput) {
  const activityScore = recencyScore(input.daysInactive);

  // Mục tiêu thực tế là học ít nhất 3 ngày/tuần, tương đương 6 ngày trong 14 ngày.
  const consistencyScore = clamp(Math.round((input.activeDays14 / 6) * 20), 0, 20);

  // Tiến độ tổng chỉ chiếm 8 điểm; 12 điểm còn lại bắt buộc đến từ tiến độ mới.
  // Căn bậc hai giúp người mới vẫn được ghi nhận khi vừa bắt đầu.
  const foundationScore = Math.round(Math.sqrt(clamp(input.overallPercent, 0, 100) / 100) * 8);
  const velocityScore = clamp(Math.round((input.completedItems14 / 4) * 12), 0, 12);
  const progressScore = foundationScore + velocityScore;

  // Chỉ tính bài tập duy nhất và điểm tốt nhất của mỗi quiz ở lớp analytics.
  // Vì vậy làm lại một bài nhiều lần không thể tăng điểm vô hạn.
  const codeMastery =
    input.attemptedExercises14 > 0
      ? Math.round((input.passedExercises14 / input.attemptedExercises14) * 15)
      : 0;
  const quizMastery =
    input.quizAttempts14 > 0
      ? Math.round((clamp(input.averageQuizPercent14, 0, 100) / 100) * 10)
      : 0;
  const masteryScore = clamp(codeMastery + quizMastery, 0, 25);

  // Xu hướng gồm 6 điểm cho khối lượng tuần hiện tại và 4 điểm cho việc duy trì/tăng
  // so với tuần trước. Cách này không thưởng tối đa cho một hoạt động đơn lẻ.
  const weeklyVolume = clamp(Math.round((input.activityUnits7 / 6) * 6), 0, 6);
  const directionBonus =
    input.activityUnits7 === 0
      ? 0
      : input.activityUnitsPrevious7 === 0 || input.activityUnits7 >= input.activityUnitsPrevious7
        ? 4
        : input.activityUnits7 >= input.activityUnitsPrevious7 * 0.75
          ? 2
          : 0;
  const momentumScore = weeklyVolume + directionBonus;

  const factors: RetentionScoreFactor[] = [
    {
      key: 'RECENCY',
      label: 'Hoạt động gần nhất',
      score: activityScore,
      maxScore: 25,
      explanation:
        input.daysInactive === 0
          ? 'Bạn có hoạt động học trong hôm nay.'
          : input.daysInactive >= 90
            ? 'Chưa ghi nhận hoạt động học.'
            : `Đã ${input.daysInactive} ngày chưa có hoạt động học.`,
    },
    {
      key: 'CONSISTENCY',
      label: 'Độ đều 14 ngày',
      score: consistencyScore,
      maxScore: 20,
      explanation: `Bạn học ${input.activeDays14}/6 ngày mục tiêu trong 14 ngày gần đây; streak hiệu lực là ${input.effectiveStreak} ngày.`,
    },
    {
      key: 'PROGRESS',
      label: 'Tiến độ mới',
      score: progressScore,
      maxScore: 20,
      explanation: `Hoàn thành ${input.completedItems14} mục mới trong 14 ngày, giai đoạn trước là ${input.completedItemsPrevious14}; tiến độ tổng hiện là ${input.overallPercent}%.`,
    },
    {
      key: 'MASTERY',
      label: 'Chất lượng thực hành',
      score: masteryScore,
      maxScore: 25,
      explanation: `${input.passedExercises14}/${input.attemptedExercises14} bài code duy nhất đã pass; điểm quiz tốt nhất trung bình ${input.averageQuizPercent14}%.`,
    },
    {
      key: 'MOMENTUM',
      label: 'Xu hướng tuần',
      score: momentumScore,
      maxScore: 10,
      explanation: `Tuần này có ${input.activityUnits7} đơn vị học tập, tuần trước có ${input.activityUnitsPrevious7}.`,
    },
  ];

  const score = clamp(
    factors.reduce((sum, factor) => sum + factor.score, 0),
    0,
    100,
  );
  const riskLevel = riskFromHealthScore(score, input.daysInactive);
  const reasons: string[] = [];

  if (input.daysInactive >= 14)
    reasons.push(
      `Đã ngừng học ${input.daysInactive} ngày, hệ thống xếp nguy cơ cao dù còn điểm tích lũy.`,
    );
  else if (input.daysInactive >= 7)
    reasons.push(
      `Đã ${input.daysInactive} ngày chưa quay lại, mức tốt nhất hiện tại chỉ là cần theo dõi.`,
    );
  else if (input.daysInactive >= 3)
    reasons.push(`Nhịp học đã gián đoạn ${input.daysInactive} ngày.`);
  if (input.activeDays14 < 3) reasons.push('Tần suất học chưa đạt 3 ngày trong 14 ngày gần đây.');
  if (input.completedItems14 === 0) reasons.push('Chưa hoàn thành nội dung mới trong 14 ngày.');
  if (input.attemptedExercises14 === 0 && input.quizAttempts14 === 0) {
    reasons.push('Chưa có bài code hoặc quiz để đo mức độ nắm kiến thức.');
  } else if (masteryScore < 13) {
    reasons.push('Chất lượng bài code và quiz gần đây còn dưới mức ổn định.');
  }
  if (input.activityUnits7 < input.activityUnitsPrevious7 * 0.75) {
    reasons.push('Khối lượng học tuần này đang giảm rõ so với tuần trước.');
  }
  if (reasons.length === 0) reasons.push('Tần suất, tiến độ và chất lượng học đang ổn định.');

  return {
    score,
    riskLevel,
    formulaVersion: 'RETENTION_V3_2026_07',
    factors,
    reasons,
  };
}
