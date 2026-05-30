import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { completeItem, getProgress } from './progress.controller.js';

const router = Router();

// Mọi route tiến độ đều yêu cầu đăng nhập.
router.get('/progress', requireAuth, getProgress);
router.post('/progress/complete', requireAuth, completeItem);

export default router;
