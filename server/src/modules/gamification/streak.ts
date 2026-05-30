// Logic tính streak (chuỗi ngày học) — Property 7.
// Tách thành hàm thuần để dễ kiểm thử, không phụ thuộc DB.

// Chuẩn hoá về số ngày (bỏ giờ) theo UTC.
export function toDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000,
  );
}

export interface StreakState {
  streakCount: number;
  lastActiveDate: Date | null;
}

// Tính streak mới khi có hoạt động vào ngày `now`.
// Quy tắc:
// - Cùng ngày với lần hoạt động trước: streak giữ nguyên.
// - Đúng ngày kế tiếp (cách 1 ngày): streak + 1.
// - Cách hơn 1 ngày (hoặc chưa từng hoạt động): streak đặt lại về 1.
export function computeStreak(prev: StreakState, now: Date): StreakState {
  const today = toDayNumber(now);

  if (!prev.lastActiveDate) {
    return { streakCount: 1, lastActiveDate: now };
  }

  const lastDay = toDayNumber(prev.lastActiveDate);
  const diff = today - lastDay;

  if (diff === 0) {
    // Đã hoạt động trong ngày hôm nay rồi -> giữ nguyên.
    return { streakCount: prev.streakCount, lastActiveDate: prev.lastActiveDate };
  }
  if (diff === 1) {
    return { streakCount: prev.streakCount + 1, lastActiveDate: now };
  }
  // Bỏ lỡ -> reset về 1 (hôm nay tính là ngày đầu của chuỗi mới).
  return { streakCount: 1, lastActiveDate: now };
}
