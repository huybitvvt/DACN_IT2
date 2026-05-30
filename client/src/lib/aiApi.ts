import { api } from './api';

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiSource {
  title: string;
  courseTitle: string;
}

export interface AiChatResponse {
  reply: string;
  outOfScope: boolean;
  sources: AiSource[];
}

export async function sendChat(
  message: string,
  options: { lessonId?: string; history?: ChatHistoryItem[] } = {},
): Promise<AiChatResponse> {
  const { data } = await api.post<AiChatResponse>('/ai/chat', {
    message,
    lessonId: options.lessonId,
    history: options.history,
  });
  return data;
}
