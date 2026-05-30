import { Router } from 'express';
import { getLeaderboard } from './leaderboard.controller.js';

const router = Router();

// Bảng xếp hạng công khai (ai cũng xem được).
router.get('/leaderboard', getLeaderboard);

export default router;
