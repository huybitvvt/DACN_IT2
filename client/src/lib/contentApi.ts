import { api } from './api';
import type { Course, ProgrammingLanguage } from '@/types';

export interface LessonSummary {
  id: string;
  title: string;
  order: number;
  isPublic: boolean;
}

export interface CourseWithLessons extends Course {
  lessons: LessonSummary[];
}

export interface Example {
  id: string;
  language: ProgrammingLanguage;
  code: string;
  order: number;
}

export interface LessonNav {
  id: string;
  title: string;
}

export interface LessonDetail {
  id: string;
  courseId: string;
  title: string;
  contentMarkdown: string;
  order: number;
  examples: Example[];
  exercises: { id: string; title: string }[];
  course: { id: string; slug: string; title: string; language: ProgrammingLanguage };
  quiz: { id: string } | null;
  prev: LessonNav | null;
  next: LessonNav | null;
}

export interface SearchResult {
  id: string;
  title: string;
  course: { slug: string; title: string; language: ProgrammingLanguage };
}

export async function fetchCourses(): Promise<Course[]> {
  const { data } = await api.get<{ courses: Course[] }>('/courses');
  return data.courses;
}

export async function fetchCourse(slug: string): Promise<CourseWithLessons> {
  const { data } = await api.get<{ course: CourseWithLessons }>(`/courses/${slug}`);
  return data.course;
}

export async function fetchLesson(id: string): Promise<LessonDetail> {
  const { data } = await api.get<{ lesson: LessonDetail }>(`/lessons/${id}`);
  return data.lesson;
}

export async function searchLessons(q: string): Promise<SearchResult[]> {
  const { data } = await api.get<{ results: SearchResult[] }>('/search', { params: { q } });
  return data.results;
}
