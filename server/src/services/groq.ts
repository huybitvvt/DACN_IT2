import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw AppError.badGateway('Trợ lý AI phản hồi quá chậm. Vui lòng thử lại.');
    }
    throw AppError.badGateway('Không kết nối được tới trợ lý AI.');
  } finally {
    clearTimeout(timer);
  }
}

// Gọi Groq chat completion (không streaming). Khoá API giữ ở server (Property 9).
export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  if (!env.groqApiKey) {
    throw AppError.badGateway('Trợ lý AI chưa được cấu hình (thiếu GROQ_API_KEY).');
  }

  const res = await fetchWithTimeout(
    GROQ_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.groqApiKey}`,
      },
      body: JSON.stringify({
        model: env.groqModel,
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    },
    30000,
  );

  if (!res.ok) {
    if (res.status === 429) {
      throw AppError.tooManyRequests('Trợ lý AI đang quá tải. Vui lòng thử lại sau giây lát.');
    }
    throw AppError.badGateway(`Trợ lý AI trả về lỗi (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw AppError.badGateway('Trợ lý AI không trả về nội dung.');
  }
  return content.trim();
}
