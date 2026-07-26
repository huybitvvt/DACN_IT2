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

export interface ExerciseErrorParams {
  language: 'SQL' | 'C' | 'CPP' | 'PYTHON';
  title: string;
  sourceCode: string;
  compileError?: string;
  failedTests?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
  }[];
}

export function buildExerciseErrorMessages(params: ExerciseErrorParams): ChatMessage[] {
  const failedTests = (params.failedTests ?? [])
    .slice(0, 2)
    .map(
      (test, index) =>
        `Test ${index + 1}: input=${JSON.stringify(test.input)}, mong đợi=${JSON.stringify(
          test.expectedOutput,
        )}, thực tế=${JSON.stringify(test.actualOutput)}`,
    )
    .join('\n');

  const details = [
    `Ngôn ngữ: ${params.language}`,
    `Bài: ${params.title}`,
    `Code:\n${params.sourceCode.slice(0, 6000)}`,
    params.compileError ? `Lỗi thực thi/biên dịch:\n${params.compileError.slice(0, 3000)}` : '',
    failedTests ? `Test chưa đạt:\n${failedTests}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return [
    {
      role: 'system',
      content: [
        'Bạn là trợ giảng lập trình, chuyên giải thích bài làm sai cho người mới.',
        'Chỉ dựa vào code, lỗi và test được cung cấp.',
        'Trả lời bằng tiếng Việt, tối đa 100 từ, không chào hỏi, không lặp lại đề bài.',
        'Nêu đúng nguyên nhân, chỉ ra dòng/cú pháp sai và đưa cách sửa ngắn gọn.',
        'Không đưa lời giải hoàn chỉnh nếu chỉ cần sửa một phần.',
        'Nếu không có lỗi biên dịch/thực thi thì code đã chạy: không được kết luận lỗi cú pháp.',
        'Luôn so sánh chính xác output thực tế với output mong đợi trước khi kết luận.',
      ].join('\n'),
    },
    { role: 'user', content: details },
  ];
}

export function getQuickExerciseDiagnostic(params: ExerciseErrorParams): string | null {
  const source = params.sourceCode;
  const error = params.compileError ?? '';

  if (params.language === 'PYTHON' && /^\s*print\s*['"]/m.test(source)) {
    const expected = params.failedTests?.[0]?.expectedOutput;
    const correctedCall = expected ? `print(${JSON.stringify(expected)})` : 'print("Nội dung cần in")';
    return [
      'Nguyên nhân: Trong Python 3, `print` là một hàm nhưng bạn đặt dấu nháy ngay sau tên hàm, nên câu lệnh sai cú pháp.',
      `Cách sửa: gọi hàm bằng cặp ngoặc, ví dụ \`${correctedCall}\`.`,
    ].join('\n\n');
  }

  if (params.language === 'PYTHON' && /NameError:\s*name ['"]([^'"]+)['"] is not defined/i.test(error)) {
    const variable = error.match(/NameError:\s*name ['"]([^'"]+)['"] is not defined/i)?.[1];
    return [
      `Nguyên nhân: Tên \`${variable ?? 'biến/hàm'}\` chưa được khai báo hoặc bị viết sai.`,
      'Cách sửa: kiểm tra chính tả và gán giá trị hoặc định nghĩa tên này trước khi sử dụng.',
    ].join('\n\n');
  }

  if (params.language === 'PYTHON' && /IndentationError|TabError/i.test(error)) {
    return [
      'Nguyên nhân: Khối lệnh Python đang thụt lề không nhất quán.',
      'Cách sửa: dùng cùng một kiểu thụt lề, nên là 4 dấu cách, và căn các câu lệnh cùng khối thẳng hàng.',
    ].join('\n\n');
  }

  const emptyOutputFailure = params.failedTests?.find(
    (test) => test.expectedOutput.length > 0 && test.actualOutput.length === 0,
  );
  if (emptyOutputFailure) {
    return [
      'Nguyên nhân: Chương trình kết thúc nhưng không tạo ra output, trong khi test đang chờ một kết quả.',
      'Cách sửa: kiểm tra câu lệnh in kết quả và bảo đảm nhánh chứa câu lệnh đó thực sự được chạy.',
    ].join('\n\n');
  }

  const literalOutputFailure = params.failedTests?.find(
    (test) =>
      test.actualOutput.length > 0 &&
      test.expectedOutput !== test.actualOutput &&
      (source.includes(JSON.stringify(test.actualOutput)) ||
        source.includes(`'${test.actualOutput.replace(/'/g, "\\'")}'`)),
  );
  if (literalOutputFailure) {
    return [
      `Nguyên nhân: Chương trình đang in ${JSON.stringify(
        literalOutputFailure.actualOutput,
      )}, nhưng test yêu cầu chính xác ${JSON.stringify(literalOutputFailure.expectedOutput)}.`,
      'Cách sửa: điều chỉnh chuỗi được in để khớp toàn bộ nội dung, chữ hoa/thường và dấu câu của output mong đợi.',
    ].join('\n\n');
  }

  return null;
}

// Luồng nhanh dành riêng cho bài tập: không truy xuất RAG, prompt ngắn và giới
// hạn đầu ra để model nhỏ chạy CPU phản hồi sớm.
export async function* handleExerciseErrorStream(
  params: ExerciseErrorParams,
): AsyncGenerator<string> {
  const quickDiagnostic = getQuickExerciseDiagnostic(params);
  if (quickDiagnostic) {
    yield quickDiagnostic;
    return;
  }

  const messages = buildExerciseErrorMessages(params);
  for await (const token of streamChatCompletion(messages, {
    maxTokens: 128,
    temperature: 0.15,
    timeoutMs: 45000,
  })) {
    yield token;
  }
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
