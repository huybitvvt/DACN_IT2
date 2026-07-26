import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getProfile } from './learning-profile.controller.js';

const router = Router();

router.get('/learning/error-profile', requireAuth, getProfile);

export default router;
