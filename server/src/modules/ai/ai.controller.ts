import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  handleChat,
  handleChatStream,
  handleExerciseErrorStream,
} from './ai.service.js';

const chatSchema = z.object({
  message: z.string().min(1, 'Vui lòng nhập câu hỏi.').max(2000),
  lessonId: z.string().min(1).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
});

const exerciseErrorSchema = z.object({
  language: z.enum(['SQL', 'C', 'CPP', 'PYTHON']),
  title: z.string().min(1).max(200),
  sourceCode: z.string().min(1).max(10000),
  compileError: z.string().max(4000).optional(),
  failedTests: z
    .array(
      z.object({
        input: z.string().max(1000),
        expectedOutput: z.string().max(1000),
        actualOutput: z.string().max(1000),
      }),
    )
    .max(2)
    .optional(),
});

// POST /api/ai/chat
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const input = chatSchema.parse(req.body);
  const result = await handleChat(input);
  res.json(result);
});

// POST /api/ai/chat/stream — trả về câu trả lời theo dòng (Server-Sent Events).
export const chatStream = asyncHandler(async (req: Request, res: Response) => {
  const input = chatSchema.parse(req.body);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    for await (const token of handleChatStream(input)) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'Trợ lý AI gặp sự cố. Vui lòng thử lại.' })}\n\n`);
  } finally {
    res.end();
  }
});

// POST /api/ai/explain-exercise-error/stream
export const explainExerciseErrorStream = asyncHandler(async (req: Request, res: Response) => {
  const input = exerciseErrorSchema.parse(req.body);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    for await (const token of handleExerciseErrorStream(input)) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch {
    res.write(
      `data: ${JSON.stringify({
        error: 'AI local phản hồi quá chậm. Hãy xem lỗi hệ thống bên dưới hoặc thử lại.',
      })}\n\n`,
    );
  } finally {
    res.end();
  }
});
