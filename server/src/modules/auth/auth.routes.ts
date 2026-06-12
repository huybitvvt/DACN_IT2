import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.js';
import { login, logout, me, register, verifyRegister } from './auth.controller.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/register/verify', authLimiter, verifyRegister);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
