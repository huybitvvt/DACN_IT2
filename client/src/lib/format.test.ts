import { describe, expect, it } from 'vitest';
import { formatRelativeTime, formatVnd } from './format';

describe('formatVnd', () => {
  it('định dạng số tiền theo VND và không có phần thập phân', () => {
    const result = formatVnd(2_000);

    expect(result).toContain('2.000');
    expect(result).toContain('₫');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-07-24T08:00:00.000Z').getTime();

  it('hiển thị vừa xong trong phút đầu tiên', () => {
    expect(formatRelativeTime('2026-07-24T07:59:30.000Z', now)).toBe('vừa xong');
  });

  it('hiển thị số phút, giờ và ngày đã qua', () => {
    expect(formatRelativeTime('2026-07-24T07:45:00.000Z', now)).toBe('15 phút trước');
    expect(formatRelativeTime('2026-07-24T05:00:00.000Z', now)).toBe('3 giờ trước');
    expect(formatRelativeTime('2026-07-21T08:00:00.000Z', now)).toBe('3 ngày trước');
  });

  it('không hiển thị thời gian âm khi đồng hồ máy khách lệch', () => {
    expect(formatRelativeTime('2026-07-24T08:05:00.000Z', now)).toBe('vừa xong');
  });
});
