import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  checkoutStatus,
  checkoutCourse,
  sepayPaymentGatewayIpn,
  sepayWebhook,
} from './payment.controller.js';

const router = Router();

router.post('/courses/:slug/checkout', requireAuth, checkoutCourse);
router.get('/courses/:slug/checkout/status', requireAuth, checkoutStatus);
router.post('/payments/sepay/webhook', sepayWebhook);
router.post('/payments/sepay/ipn', sepayPaymentGatewayIpn);

export default router;
