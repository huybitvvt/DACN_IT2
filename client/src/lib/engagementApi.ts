import { api } from './api';

export interface LessonNote {
  content: string;
  bookmarked: boolean;
}

export async function fetchNote(lessonId: string): Promise<LessonNote> {
  const { data } = await api.get<{ note: LessonNote }>(`/lessons/${lessonId}/note`);
  return data.note;
}

export async function saveNote(
  lessonId: string,
  patch: Partial<LessonNote>,
): Promise<LessonNote> {
  const { data } = await api.put<{ note: LessonNote }>(`/lessons/${lessonId}/note`, patch);
  return data.note;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { displayName: string };
}

export async function fetchComments(lessonId: string): Promise<Comment[]> {
  const { data } = await api.get<{ comments: Comment[] }>(`/lessons/${lessonId}/comments`);
  return data.comments;
}

export async function addComment(lessonId: string, content: string): Promise<Comment> {
  const { data } = await api.post<{ comment: Comment }>(`/lessons/${lessonId}/comments`, {
    content,
  });
  return data.comment;
}

export async function deleteComment(id: string): Promise<void> {
  await api.delete(`/comments/${id}`);
}
