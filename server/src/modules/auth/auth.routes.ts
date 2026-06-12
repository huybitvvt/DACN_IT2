import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.js';
import { login, logout, me, register, verifyRegister, verifyRegisterLink } from './auth.controller.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/register/verify', authLimiter, verifyRegister);
router.get('/register/verify-link', authLimiter, verifyRegisterLink);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
