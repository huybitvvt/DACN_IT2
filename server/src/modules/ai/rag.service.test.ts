import { describe, it, expect } from 'vitest';
import {
  buildContext,
  focusLessonContent,
  looksInScope,
  type RetrievedLesson,
} from './rag.service.js';

describe('looksInScope - guardrail phụ', () => {
  it('nhận diện câu hỏi trong phạm vi lập trình', () => {
    expect(looksInScope('làm sao để in ra trong python')).toBe(true);
    expect(looksInScope('câu lệnh SELECT trong SQL')).toBe(true);
    expect(looksInScope('con trỏ trong C là gì')).toBe(true);
    expect(looksInScope('giải thích lỗi compile')).toBe(true);
  });

  it('loại câu hỏi ngoài phạm vi', () => {
    expect(looksInScope('thời tiết hôm nay thế nào')).toBe(false);
    expect(looksInScope('kể chuyện cười cho tôi nghe')).toBe(false);
    expect(looksInScope('giá vàng hôm nay')).toBe(false);
  });
});

describe('buildContext', () => {
  it('trả chuỗi rỗng khi không có bài học', () => {
    expect(buildContext([])).toBe('');
  });

  it('ghép ngữ cảnh kèm nguồn', () => {
    const lessons: RetrievedLesson[] = [
      {
        id: 'l1',
        title: 'Hello World',
        courseTitle: 'Python',
        contentMarkdown: 'Dùng print() để in.',
        rank: 0.5,
      },
    ];
    const ctx = buildContext(lessons);
    expect(ctx).toContain('Python');
    expect(ctx).toContain('Hello World');
    expect(ctx).toContain('print()');
  });

  it('chọn đoạn liên quan thay vì luôn lấy phần mở đầu', () => {
    const content = [
      'Giới thiệu chung về ngôn ngữ và lịch sử phát triển.'.repeat(10),
      'Dùng hàm print() để in chuỗi ra màn hình trong Python.',
      'Phần bài tập thực hành.'.repeat(10),
    ].join('\n\n');

    const focused = focusLessonContent(content, 'hàm print Python', 200);

    expect(focused).toContain('print()');
    expect(focused.length).toBeLessThanOrEqual(200);
  });
});
