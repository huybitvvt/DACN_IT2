import { Router } from 'express';
import { heavyLimiter } from '../../middleware/rateLimit.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { getExercise, getSubmissionHistory, submitExercise } from './exercise.controller.js';

const router = Router();

// Xem đề bài: công khai (khách cũng thử được - Yêu cầu 4.7).
router.get('/exercises/:id', getExercise);

// Lịch sử bài nộp: yêu cầu đăng nhập.
router.get('/exercises/:id/submissions', requireAuth, getSubmissionHistory);

// Nộp bài: optionalAuth để biết có lưu kết quả hay không; rate limit chặt.
router.post('/exercises/:id/submit', optionalAuth, heavyLimiter, submitExercise);

export default router;
