import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  checkoutCourse,
  confirmCourseDemo,
  sepayPaymentGatewayIpn,
  sepayWebhook,
} from './payment.controller.js';

const router = Router();

router.post('/courses/:slug/checkout', requireAuth, checkoutCourse);
router.post('/courses/:slug/checkout/demo-confirm', requireAuth, confirmCourseDemo);
router.post('/payments/sepay/webhook', sepayWebhook);
router.post('/payments/sepay/ipn', sepayPaymentGatewayIpn);

export default router;
