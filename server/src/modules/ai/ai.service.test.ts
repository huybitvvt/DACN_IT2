import { describe, expect, it } from 'vitest';
import {
  buildExerciseErrorMessages,
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
