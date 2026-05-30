// Dữ liệu mẫu cho 4 khoá học. Nội dung từng khoá tách ra file riêng trong ./courses
// để dễ mở rộng và bảo trì.

export type Lang = 'SQL' | 'C' | 'CPP' | 'PYTHON';

export interface SeedChoice {
  text: string;
  isCorrect: boolean;
}
export interface SeedQuestion {
  text: string;
  type: 'SINGLE' | 'MULTI';
  choices: SeedChoice[];
}
export interface SeedTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}
export interface SeedExercise {
  title: string;
  promptMarkdown: string;
  language: Lang;
  starterCode: string;
  testCases: SeedTestCase[];
}
export interface SeedExample {
  language: Lang;
  code: string;
}
export interface SeedLesson {
  title: string;
  contentMarkdown: string;
  examples: SeedExample[];
  exercises: SeedExercise[];
  questions: SeedQuestion[];
}
export interface SeedCourse {
  slug: string;
  title: string;
  language: Lang;
  description: string;
  order: number;
  lessons: SeedLesson[];
}

// Import nội dung từng khoá.
// eslint-disable-next-line import/first
import { pythonCourse } from './courses/python.js';
import { sqlCourse } from './courses/sql.js';
import { cCourse } from './courses/c.js';
import { cppCourse } from './courses/cpp.js';

export const courses: SeedCourse[] = [pythonCourse, sqlCourse, cCourse, cppCourse];

export const badges = [
  { code: 'FIRST_LESSON', title: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên.' },
  { code: 'FIRST_EXERCISE', title: 'Lập trình viên', description: 'Giải đúng bài tập đầu tiên.' },
  {
    code: 'COURSE_COMPLETE',
    title: 'Chinh phục khoá học',
    description: 'Hoàn thành trọn vẹn một khoá học.',
  },
  { code: 'STREAK_7', title: 'Kiên trì 7 ngày', description: 'Học liên tục 7 ngày.' },
];
