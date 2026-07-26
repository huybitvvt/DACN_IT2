import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './notification.controller.js';

const router = Router();

router.get('/notifications', requireAuth, controller.list);
router.get('/notifications/preferences', requireAuth, controller.preferences);
router.put('/notifications/preferences', requireAuth, controller.updatePreferences);
router.put('/notifications/read-all', requireAuth, controller.markAllRead);
router.put('/notifications/:id/read', requireAuth, controller.markRead);

export default router;
