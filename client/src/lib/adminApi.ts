import { api } from './api';
import type { ProgrammingLanguage, Role } from '@/types';
import type { PurchaseStatus } from './paymentApi';

export interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  language: ProgrammingLanguage;
  description: string;
  order: number;
}

export interface AdminLesson {
  id: string;
  courseId: string;
  title: string;
  contentMarkdown: string;
  order: number;
  isPublic: boolean;
}

export interface AdminTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface AdminExercise {
  id: string;
  lessonId: string;
  title: string;
  promptMarkdown: string;
  language: ProgrammingLanguage;
  starterCode: string;
  order: number;
  testCases: AdminTestCase[];
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  streakCount: number;
  createdAt: string;
}

export interface AdminPurchase {
  id: string;
  status: PurchaseStatus;
  amountVnd: number;
  paymentCode: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  course: {
    id: string;
    slug: string;
    title: string;
    language: ProgrammingLanguage;
  };
}

// ---- Courses ----
export const adminListCourses = () =>
  api.get<{ courses: AdminCourse[] }>('/admin/courses').then((r) => r.data.courses);
export const adminCreateCourse = (data: Partial<AdminCourse>) =>
  api.post('/admin/courses', data).then((r) => r.data);
export const adminUpdateCourse = (id: string, data: Partial<AdminCourse>) =>
  api.put(`/admin/courses/${id}`, data).then((r) => r.data);
export const adminDeleteCourse = (id: string) =>
  api.delete(`/admin/courses/${id}`).then((r) => r.data);

// ---- Lessons ----
export const adminListLessons = (courseId?: string) =>
  api
    .get<{ lessons: AdminLesson[] }>('/admin/lessons', { params: { courseId } })
    .then((r) => r.data.lessons);
export const adminCreateLesson = (data: Partial<AdminLesson>) =>
  api.post('/admin/lessons', data).then((r) => r.data);
export const adminUpdateLesson = (id: string, data: Partial<AdminLesson>) =>
  api.put(`/admin/lessons/${id}`, data).then((r) => r.data);
export const adminDeleteLesson = (id: string) =>
  api.delete(`/admin/lessons/${id}`).then((r) => r.data);

// ---- Exercises ----
export const adminListExercises = (lessonId?: string) =>
  api
    .get<{ exercises: AdminExercise[] }>('/admin/exercises', { params: { lessonId } })
    .then((r) => r.data.exercises);
export const adminCreateExercise = (data: Partial<AdminExercise>) =>
  api.post('/admin/exercises', data).then((r) => r.data);
export const adminUpdateExercise = (id: string, data: Partial<AdminExercise>) =>
  api.put(`/admin/exercises/${id}`, data).then((r) => r.data);
export const adminDeleteExercise = (id: string) =>
  api.delete(`/admin/exercises/${id}`).then((r) => r.data);

// ---- Users ----
export const adminListUsers = () =>
  api.get<{ users: AdminUser[] }>('/admin/users').then((r) => r.data.users);

// ---- Purchases ----
export const adminListPurchases = (params: { status?: PurchaseStatus | ''; q?: string }) =>
  api
    .get<{ purchases: AdminPurchase[] }>('/admin/purchases', { params })
    .then((r) => r.data.purchases);

export const adminMarkPurchasePaid = (id: string) =>
  api.post<{ purchase: AdminPurchase }>(`/admin/purchases/${id}/mark-paid`).then((r) => r.data.purchase);
