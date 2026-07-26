import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  checkoutStatus,
  checkoutCourse,
  demoConfirmPayment,
  purchaseHistory,
  sepayPaymentGatewayIpn,
  sepayWebhook,
} from './payment.controller.js';

const router = Router();

router.get('/purchases', requireAuth, purchaseHistory);
router.post('/courses/:slug/checkout', requireAuth, checkoutCourse);
router.get('/courses/:slug/checkout/status', requireAuth, checkoutStatus);
router.post('/courses/:slug/checkout/demo-confirm', requireAuth, demoConfirmPayment);
router.post('/payments/sepay/webhook', sepayWebhook);
router.post('/payments/sepay/ipn', sepayPaymentGatewayIpn);

export default router;
