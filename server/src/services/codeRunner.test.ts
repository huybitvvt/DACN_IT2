import { describe, expect, it } from 'vitest';
import { selectJudge0Language } from './codeRunner.js';

const languages = [
  { id: 50, name: 'C (GCC 9.2.0)' },
  { id: 54, name: 'C++ (GCC 9.2.0)' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  { id: 71, name: 'Python (3.8.1)' },
  { id: 74, name: 'TypeScript (3.7.4)' },
  { id: 82, name: 'SQL (SQLite 3.27.2)' },
];

describe('Judge0 language resolver', () => {
  it('ánh xạ alias nền tảng sang runtime Judge0', () => {
    expect(selectJudge0Language('CPP', languages)?.id).toBe(54);
    expect(selectJudge0Language('python3', languages)?.id).toBe(71);
    expect(selectJudge0Language('ts', languages)?.id).toBe(74);
  });

  it('tìm được ngôn ngữ mới theo tên mà không sửa code runner', () => {
    expect(selectJudge0Language('JAVA', languages)?.id).toBe(62);
  });

  it('trả null khi Judge0 không cài runtime', () => {
    expect(selectJudge0Language('ELM', languages)).toBeNull();
  });
});
