import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const chatCompletionsUrl = `${env.localLlmBaseUrl.replace(/\/$/, '')}/chat/completions`;
const LOCAL_LLM_TIMEOUT_MS = 180000;
const LOCAL_LLM_MAX_TOKENS = 512;

function authHeaders(): Record<string, string> {
  return env.localLlmApiKey ? { Authorization: `Bearer ${env.localLlmApiKey}` } : {};
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw AppError.badGateway('Trợ lý AI local phản hồi quá chậm. Vui lòng thử lại.');
    }
    throw AppError.badGateway('Không kết nối được tới trợ lý AI local.');
  } finally {
    clearTimeout(timer);
  }
}

// Gọi LLM local qua API tương thích OpenAI, ví dụ llama.cpp server hoặc
// llama-cpp-python server. Không phụ thuộc Groq/API quota bên ngoài.
export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const res = await fetchWithTimeout(
    chatCompletionsUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({
        model: env.localLlmModel,
        messages,
        temperature: 0.3,
        max_tokens: LOCAL_LLM_MAX_TOKENS,
      }),
    },
    LOCAL_LLM_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw AppError.badGateway(`Trợ lý AI local trả về lỗi (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw AppError.badGateway('Trợ lý AI local không trả về nội dung.');
  }
  return content.trim();
}

// Streaming token từ LLM local qua SSE OpenAI-compatible.
export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(chatCompletionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      model: env.localLlmModel,
      messages,
      temperature: 0.3,
      max_tokens: LOCAL_LLM_MAX_TOKENS,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw AppError.badGateway(`Trợ lý AI local trả về lỗi (HTTP ${res.status}).`);
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
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const token = json.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {
        // Bỏ qua dòng SSE không phải JSON hợp lệ.
      }
    }
  }
}
