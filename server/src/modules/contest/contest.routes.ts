import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  claimReward,
  getContest,
  getContests,
  getMyContest,
  getRoom,
  startAttempt,
  submitAttempt,
} from './contest.controller.js';

const router = Router();

router.get('/contests', requireAuth, getContests);
router.get('/contests/:slug', requireAuth, getContest);
router.get('/contests/:slug/me', requireAuth, getMyContest);
router.post('/contests/:slug/claim-reward', requireAuth, claimReward);
router.get('/contests/:slug/room', requireAuth, getRoom);
router.post('/contests/:slug/room/start', requireAuth, startAttempt);
router.post('/contests/:slug/room/submit', requireAuth, submitAttempt);

export default router;
