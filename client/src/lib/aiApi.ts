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

// Gửi chat ở chế độ streaming. Gọi onToken mỗi khi nhận được một đoạn text.
export async function sendChatStream(
  message: string,
  options: { lessonId?: string; history?: ChatHistoryItem[] } = {},
  onToken?: (token: string) => void,
): Promise<void> {
  const res = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, lessonId: options.lessonId, history: options.history }),
  });

  if (!res.ok || !res.body) {
    throw new Error('Không kết nối được tới trợ lý AI.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload) as { token?: string; error?: string };
        if (json.error) throw new Error(json.error);
        if (json.token) onToken?.(json.token);
      } catch {
        // bỏ qua dòng lỗi parse
      }
    }
  }
}
