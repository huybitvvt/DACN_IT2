// Các kiểu dữ liệu dùng chung phía client, ánh xạ theo model backend.

export type Role = 'LEARNER' | 'ADMIN';

export type ProgrammingLanguage = string;

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
  priceVnd: number;
  order: number;
  purchaseStatus?: 'PENDING' | 'PAID' | null;
  isPurchased?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  contentMarkdown: string;
  order: number;
  isPublic: boolean;
}
