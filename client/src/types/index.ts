// Các kiểu dữ liệu dùng chung phía client, ánh xạ theo model backend.

export type Role = 'LEARNER' | 'ADMIN';

export type ProgrammingLanguage = 'SQL' | 'C' | 'CPP' | 'PYTHON';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  streakCount: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  language: ProgrammingLanguage;
  description: string;
  order: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  contentMarkdown: string;
  order: number;
  isPublic: boolean;
}
