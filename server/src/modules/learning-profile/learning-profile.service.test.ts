import { describe, expect, it } from 'vitest';
import { classifySubmissionError } from './learning-profile.service.js';

describe('classifySubmissionError', () => {
  it('nhận diện biến chưa khai báo', () => {
    const result = classifySubmissionError({
      language: 'CPP',
      sourceCode: 'int main(){ return total; }',
      grade: {
        status: 'ERROR',
        passed: 0,
        total: 1,
        results: [],
        compileError: "error: 'total' was not declared in this scope",
      },
    });
    expect(result.errorCategory).toBe('UNDECLARED_IDENTIFIER');
    expect(result.errorFingerprint).toBe('CPP:UNDECLARED_IDENTIFIER');
  });

  it('nhận diện lời giải chỉ pass một phần', () => {
    const result = classifySubmissionError({
      language: 'PYTHON',
      sourceCode: 'print(1)',
      grade: {
        status: 'FAILED',
        passed: 1,
        total: 3,
        results: [],
      },
    });
    expect(result.errorCategory).toBe('PARTIAL_SOLUTION');
  });
});
