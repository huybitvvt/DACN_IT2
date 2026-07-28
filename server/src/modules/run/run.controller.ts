import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { executeCode, listJudge0Languages } from '../../services/codeRunner.js';

const runSchema = z.object({
  language: z.string().trim().min(1).max(80),
  sourceCode: z.string().min(1, 'Mã nguồn không được rỗng.').max(50000),
  stdin: z.string().max(10000).optional(),
});

export const getRunnerLanguages = asyncHandler(async (_req: Request, res: Response) => {
  const languages = await listJudge0Languages();
  res.json({ languages });
});

// POST /api/run — chạy thử code (không chấm điểm). Dùng cho C/C++ ở playground.
export const runCode = asyncHandler(async (req: Request, res: Response) => {
  const input = runSchema.parse(req.body);
  const result = await executeCode({
    language: input.language,
    sourceCode: input.sourceCode,
    stdin: input.stdin,
  });
  res.json(result);
});
