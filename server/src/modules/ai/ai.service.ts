import { chatCompletion, streamChatCompletion, type ChatMessage } from '../../services/localLlm.js';
import { prisma } from '../../db/prisma.js';
import {
  buildContext,
  looksInScope,
  retrieveRelevantLessons,
} from './rag.service.js';

// Câu từ chối mặc định khi câu hỏi ngoài phạm vi (Property 8).
export const OUT_OF_SCOPE_REPLY =
  'Mình là trợ lý học lập trình của website, chỉ hỗ trợ các câu hỏi về SQL, C, C++, Python và nội dung khoá học ở đây. Bạn thử hỏi mình về một chủ đề lập trình nhé!';

// System prompt giới hạn phạm vi nghiêm ngặt.
function buildSystemPrompt(context: string): string {
  return [
    'Bạn là trợ lý học lập trình của một website dạy SQL, C, C++ và Python.',
    'QUY TẮC BẮT BUỘC:',
    '1. CHỈ trả lời các câu hỏi liên quan đến lập trình (SQL, C, C++, Python) và nội dung khoá học.',
    '2. Nếu câu hỏi KHÔNG liên quan đến lập trình hoặc nội dung website, hãy từ chối lịch sự và mời người dùng quay lại chủ đề học tập. KHÔNG trả lời câu hỏi ngoài phạm vi.',
    '3. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu cho người mới học. Dùng ví dụ code khi phù hợp.',
    '4. Khi giải thích lỗi code, nêu nguyên nhân và cách sửa cụ thể.',
    context
      ? `\nNgữ cảnh từ bài học liên quan (ưu tiên dùng để trả lời):\n${context}`
      : '',
  ].join('\n');
}

export interface AiChatParams {
  message: string;
  lessonId?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AiChatResult {
  reply: string;
  outOfScope: boolean;
  sources: { title: string; courseTitle: string }[];
}

// Chuẩn bị messages cho LLM local (RAG + system prompt + lịch sử). Dùng chung cho
// cả chế độ thường lẫn streaming. Trả về null nếu câu hỏi ngoài phạm vi.
async function prepareMessages(
  params: AiChatParams,
): Promise<{ messages: ChatMessage[]; sources: { title: string; courseTitle: string }[] } | null> {
  const { message, lessonId, history = [] } = params;

  const retrieved = await retrieveRelevantLessons(message, 3);
  if (retrieved.length === 0 && !looksInScope(message)) {
    return null; // ngoài phạm vi
  }

  let extraContext = '';
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true, contentMarkdown: true, course: { select: { title: true } } },
    });
    if (lesson) {
      extraContext = `[Bài học đang xem: ${lesson.course.title} - ${lesson.title}]\n${lesson.contentMarkdown.slice(0, 1500)}\n\n`;
    }
  }

  const context = extraContext + buildContext(retrieved);
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(context) },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  return { messages, sources: retrieved.map((l) => ({ title: l.title, courseTitle: l.courseTitle })) };
}

// Phiên bản streaming: yield từng token. Nếu ngoài phạm vi, yield câu từ chối.
export async function* handleChatStream(params: AiChatParams): AsyncGenerator<string> {
  const prepared = await prepareMessages(params);
  if (!prepared) {
    yield OUT_OF_SCOPE_REPLY;
    return;
  }
  for await (const token of streamChatCompletion(prepared.messages)) {
    yield token;
  }
}

// Xử lý một lượt chat: RAG + guardrail + gọi LLM local.
export async function handleChat(params: AiChatParams): Promise<AiChatResult> {
  const { message, lessonId, history = [] } = params;

  // Truy xuất ngữ cảnh liên quan (RAG).
  const retrieved = await retrieveRelevantLessons(message, 3);

  // Guardrail phụ phía backend: nếu không có bài liên quan VÀ câu hỏi không
  // chứa từ khoá lập trình -> từ chối luôn, không tốn lượt gọi LLM (Property 8).
  if (retrieved.length === 0 && !looksInScope(message)) {
    return { reply: OUT_OF_SCOPE_REPLY, outOfScope: true, sources: [] };
  }

  // Nếu có lessonId, thêm nội dung bài học hiện tại vào ngữ cảnh.
  let extraContext = '';
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true, contentMarkdown: true, course: { select: { title: true } } },
    });
    if (lesson) {
      extraContext = `[Bài học đang xem: ${lesson.course.title} - ${lesson.title}]\n${lesson.contentMarkdown.slice(0, 1500)}\n\n`;
    }
  }

  const context = extraContext + buildContext(retrieved);

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(context) },
    // Giới hạn lịch sử để tránh prompt quá dài.
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const reply = await chatCompletion(messages);

  return {
    reply,
    outOfScope: false,
    sources: retrieved.map((l) => ({ title: l.title, courseTitle: l.courseTitle })),
  };
}
