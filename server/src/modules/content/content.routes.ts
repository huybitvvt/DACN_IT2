import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getCourse, getCourses, getLesson, search } from './content.controller.js';

const router = Router();

router.get('/courses', requireAuth, getCourses);
router.get('/courses/:slug', requireAuth, getCourse);
router.get('/lessons/:id', requireAuth, getLesson);
router.get('/search', search);

export default router;
