import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  forgotPassword,
  googleCallback,
  googleLogin,
  login,
  logout,
  me,
  register,
  resetPasswordController,
  verifyRegister,
  verifyRegisterLink,
} from './auth.controller.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/register/verify', authLimiter, verifyRegister);
router.get('/register/verify-link', authLimiter, verifyRegisterLink);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordController);
router.get('/google', authLimiter, googleLogin);
router.get('/google/callback', authLimiter, googleCallback);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
