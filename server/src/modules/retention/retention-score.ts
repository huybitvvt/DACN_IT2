export type LearnerRiskLevel = 'ON_TRACK' | 'WATCH' | 'AT_RISK';

export interface RetentionScoreInput {
  daysInactive: number;
  overallPercent: number;
  streak: number;
  recentPassedSubmissions: number;
  recentQuizAttempts: number;
  badges: number;
}

export interface RetentionScoreFactor {
  key: 'ACTIVITY' | 'PROGRESS' | 'STREAK' | 'RECENT_PRACTICE' | 'BADGES';
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function riskFromHealthScore(score: number): LearnerRiskLevel {
  if (score >= 75) return 'ON_TRACK';
  if (score >= 45) return 'WATCH';
  return 'AT_RISK';
}

export function calculateRetentionHealth(input: RetentionScoreInput) {
  const activityScore =
    input.daysInactive === 0
      ? 35
      : input.daysInactive === 1
        ? 26
        : input.daysInactive === 2
          ? 18
          : input.daysInactive <= 6
            ? 8
            : 0;
  const progressScore = clamp(Math.round(input.overallPercent * 0.3), 0, 30);
  const streakScore = clamp(input.streak * 3, 0, 15);
  const recentCount = input.recentPassedSubmissions + input.recentQuizAttempts;
  const recentScore = clamp(recentCount * 3, 0, 15);
  const badgeScore = clamp(input.badges * 2, 0, 5);

  const factors: RetentionScoreFactor[] = [
    {
      key: 'ACTIVITY',
      label: 'Mức độ hoạt động',
      score: activityScore,
      maxScore: 35,
      explanation:
        input.daysInactive === 0
          ? 'Có hoạt động học trong hôm nay.'
          : input.daysInactive >= 90
            ? 'Chưa ghi nhận hoạt động học.'
            : `Đã ${input.daysInactive} ngày chưa có hoạt động học.`,
    },
    {
      key: 'PROGRESS',
      label: 'Tiến độ khóa học',
      score: progressScore,
      maxScore: 30,
      explanation: `Đã hoàn thành ${input.overallPercent}% nội dung của các khóa đã mua.`,
    },
    {
      key: 'STREAK',
      label: 'Chuỗi học liên tục',
      score: streakScore,
      maxScore: 15,
      explanation:
        input.streak > 0 ? `Đang duy trì chuỗi ${input.streak} ngày.` : 'Chưa có chuỗi học liên tục.',
    },
    {
      key: 'RECENT_PRACTICE',
      label: 'Thực hành 7 ngày gần đây',
      score: recentScore,
      maxScore: 15,
      explanation: `${input.recentPassedSubmissions} bài code pass và ${input.recentQuizAttempts} lượt quiz.`,
    },
    {
      key: 'BADGES',
      label: 'Thành tích',
      score: badgeScore,
      maxScore: 5,
      explanation: `Đã nhận ${input.badges} huy hiệu.`,
    },
  ];
  const score = clamp(factors.reduce((sum, factor) => sum + factor.score, 0), 0, 100);
  const riskLevel = riskFromHealthScore(score);
  const reasons: string[] = [];

  if (input.daysInactive >= 7) reasons.push(`Không học trong ${input.daysInactive} ngày.`);
  else if (input.daysInactive >= 3) reasons.push(`Nhịp học đã gián đoạn ${input.daysInactive} ngày.`);
  if (input.overallPercent < 20) reasons.push('Tiến độ khóa học còn dưới 20%.');
  if (input.streak === 0) reasons.push('Chưa hình thành chuỗi học liên tục.');
  if (recentCount === 0) reasons.push('Không có bài code pass hoặc quiz trong 7 ngày gần đây.');
  if (reasons.length === 0) reasons.push('Các tín hiệu học tập đang ổn định.');

  return {
    score,
    riskLevel,
    formulaVersion: 'RULE_V2_2026_07',
    factors,
    reasons,
  };
}
