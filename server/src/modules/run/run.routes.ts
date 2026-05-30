import { Router } from 'express';
import { heavyLimiter } from '../../middleware/rateLimit.js';
import { runCode } from './run.controller.js';

const router = Router();

// Chạy thử code tốn tài nguyên -> áp rate limit chặt (Yêu cầu 10.6).
router.post('/run', heavyLimiter, runCode);

export default router;
