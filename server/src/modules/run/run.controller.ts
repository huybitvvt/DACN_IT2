import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { executeCode } from '../../services/codeRunner.js';

const runSchema = z.object({
  language: z.enum(['C', 'CPP', 'PYTHON']),
  sourceCode: z.string().min(1, 'Mã nguồn không được rỗng.').max(50000),
  stdin: z.string().max(10000).optional(),
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
