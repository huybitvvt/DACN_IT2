import { Router } from 'express';
import { heavyLimiter } from '../../middleware/rateLimit.js';
import { optionalAuth } from '../../middleware/auth.js';
import { chat } from './ai.controller.js';

const router = Router();

// Chat AI tốn tài nguyên/chi phí -> rate limit chặt (Yêu cầu 10.6).
router.post('/ai/chat', optionalAuth, heavyLimiter, chat);

export default router;
