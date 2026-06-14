import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { checkoutCourse, confirmCourseDemo } from './payment.controller.js';

const router = Router();

router.post('/courses/:slug/checkout', requireAuth, checkoutCourse);
router.post('/courses/:slug/checkout/demo-confirm', requireAuth, confirmCourseDemo);

export default router;
