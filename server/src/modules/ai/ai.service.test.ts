import { describe, expect, it } from 'vitest';
import {
  buildExerciseErrorMessages,
  getQuickChatReply,
  getQuickExerciseDiagnostic,
  type ExerciseErrorParams,
} from './ai.service.js';

const pythonPrintError: ExerciseErrorParams = {
  language: 'PYTHON',
  title: 'In ra lời chào',
  sourceCode: `print'("Hello, World!")`,
  compileError: 'SyntaxError: invalid syntax',
  failedTests: [{ input: '', expectedOutput: 'Hello, World!', actualOutput: '' }],
};

describe('phân tích nhanh lỗi bài tập', () => {
  it('giải thích chính xác cú pháp print sai mà không cần gọi LLM', () => {
    const result = getQuickExerciseDiagnostic(pythonPrintError);

    expect(result).toContain('print` là một hàm');
    expect(result).toContain('print("Hello, World!")');
  });

  it('nhận diện chương trình không tạo output', () => {
    const result = getQuickExerciseDiagnostic({
      ...pythonPrintError,
      sourceCode: 'x = 1',
      compileError: undefined,
    });

    expect(result).toContain('không tạo ra output');
  });

  it('so sánh chính xác chuỗi literal đang in với output mong đợi', () => {
    const result = getQuickExerciseDiagnostic({
      ...pythonPrintError,
      sourceCode: 'print("Hello")',
      compileError: undefined,
      failedTests: [{ input: '', expectedOutput: 'Hello, World!', actualOutput: 'Hello' }],
    });

    expect(result).toContain('"Hello"');
    expect(result).toContain('"Hello, World!"');
    expect(result).not.toContain('lỗi cú pháp');
  });

  it('giữ prompt LLM ngắn và chứa dữ liệu chấm cần thiết', () => {
    const messages = buildExerciseErrorMessages({
      ...pythonPrintError,
      sourceCode: 'print("Hello")',
      compileError: undefined,
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain('tối đa 100 từ');
    expect(messages[1].content).toContain('Hello, World!');
  });
});

describe('phản hồi nhanh chatbot', () => {
  it('không tự sửa ngầm câu lệnh print có dấu nháy thừa', () => {
    const reply = getQuickChatReply(`print'("Hello, World!")`);

    expect(reply).toContain('sai cú pháp');
    expect(reply).toContain('dấu nháy ngay sau `print`');
    expect(reply).toContain('print("Hello, World!")');
  });

  it('xác nhận đúng câu lệnh print hợp lệ', () => {
    const reply = getQuickChatReply('```python\nprint("Xin chào")\n```');

    expect(reply).toContain('đúng cú pháp');
    expect(reply).toContain('Xin chào');
    expect(reply).not.toContain('sai cú pháp');
  });

  it('trả lời đúng SQL JOIN mà không gọi model', () => {
    const reply = getQuickChatReply('SQL JOIN là gì?');

    expect(reply).toContain('INNER JOIN');
    expect(reply).toContain('ON u.id = o.user_id');
    expect(reply).not.toContain('WHERE name');
  });

  it('đưa ví dụ vòng lặp chính xác', () => {
    const reply = getQuickChatReply('Cho ví dụ về vòng lặp');

    expect(reply).toContain('range(3)');
    expect(reply).toContain('`0`, `1`, `2`');
  });

  it('yêu cầu thêm dữ liệu thay vì đoán lỗi không được cung cấp', () => {
    const reply = getQuickChatReply('Giải thích lỗi này');

    expect(reply).toContain('gửi đoạn code');
    expect(reply).toContain('thông báo lỗi');
  });
});
