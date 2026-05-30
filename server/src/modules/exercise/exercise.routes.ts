import { Router } from 'express';
import { heavyLimiter } from '../../middleware/rateLimit.js';
import { optionalAuth } from '../../middleware/auth.js';
import { getExercise, submitExercise } from './exercise.controller.js';

const router = Router();

// Xem đề bài: công khai (khách cũng thử được - Yêu cầu 4.7).
router.get('/exercises/:id', getExercise);

// Nộp bài: optionalAuth để biết có lưu kết quả hay không; rate limit chặt.
router.post('/exercises/:id/submit', optionalAuth, heavyLimiter, submitExercise);

export default router;
