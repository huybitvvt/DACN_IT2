import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { handleChat } from './ai.service.js';

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

// POST /api/ai/chat
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const input = chatSchema.parse(req.body);
  const result = await handleChat(input);
  res.json(result);
});
