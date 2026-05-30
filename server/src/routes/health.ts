import { Router } from 'express';

const router = Router();

// Health-check đơn giản để kiểm tra server sống.
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'learn-programming-platform-api',
    time: new Date().toISOString(),
  });
});

export default router;
