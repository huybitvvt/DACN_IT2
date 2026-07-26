import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getHistory, getPlan } from './retention.controller.js';

const router = Router();

router.get('/retention/plan', requireAuth, getPlan);
router.get('/retention/interventions', requireAuth, getHistory);

export default router;
