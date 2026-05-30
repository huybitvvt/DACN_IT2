import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getCertificate } from './certificate.controller.js';

const router = Router();

router.get('/certificate/:slug', requireAuth, getCertificate);

export default router;
