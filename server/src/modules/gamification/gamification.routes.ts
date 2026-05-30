import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getGamification } from './gamification.controller.js';

const router = Router();

router.get('/gamification', requireAuth, getGamification);

export default router;
