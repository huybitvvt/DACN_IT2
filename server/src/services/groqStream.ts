import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import type { ChatMessage } from './groq.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Gọi Groq ở chế độ streaming. Trả về async iterator các đoạn text (token).
export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  if (!env.groqApiKey) {
    throw AppError.badGateway('Trợ lý AI chưa được cấu hình (thiếu GROQ_API_KEY).');
  }

  const res = await fetch(GROQ_URL, {
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
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    if (res.status === 429) {
      throw AppError.tooManyRequests('Trợ lý AI đang quá tải. Vui lòng thử lại sau.');
    }
    throw AppError.badGateway(`Trợ lý AI trả về lỗi (HTTP ${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE: mỗi sự kiện phân tách bằng dòng trống, dòng bắt đầu bằng "data: ".
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const token = json.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {
        // Bỏ qua dòng không phải JSON hợp lệ.
      }
    }
  }
}
