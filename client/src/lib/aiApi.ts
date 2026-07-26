import { api, apiUrl } from './api';
import type { ProgrammingLanguage } from '@/types';

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

interface TokenStreamEvent {
  token?: string;
  error?: string;
}

async function consumeTokenStream(
  path: string,
  body: unknown,
  timeoutMs: number,
  onToken?: (token: string) => void,
): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      throw new Error('Không kết nối được tới trợ lý AI.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      streamDone = done;
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;
        let json: TokenStreamEvent;
        try {
          json = JSON.parse(payload) as TokenStreamEvent;
        } catch {
          continue;
        }
        if (json.error) throw new Error(json.error);
        if (json.token) onToken?.(json.token);
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AI local phản hồi quá chậm. Vui lòng thử lại.');
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
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
  await consumeTokenStream(
    '/ai/chat/stream',
    { message, lessonId: options.lessonId, history: options.history },
    185000,
    onToken,
  );
}

export interface ExerciseErrorAnalysisInput {
  language: ProgrammingLanguage;
  title: string;
  sourceCode: string;
  compileError?: string;
  failedTests?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
  }[];
}

export async function explainExerciseErrorStream(
  input: ExerciseErrorAnalysisInput,
  onToken?: (token: string) => void,
): Promise<void> {
  await consumeTokenStream('/ai/explain-exercise-error/stream', input, 50000, onToken);
}
