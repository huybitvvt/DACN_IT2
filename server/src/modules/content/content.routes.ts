import { Router } from 'express';
import { getCourse, getCourses, getLesson, search } from './content.controller.js';

// Các route nội dung công khai (khách cũng xem được - Yêu cầu 2.5).
const router = Router();

router.get('/courses', getCourses);
router.get('/courses/:slug', getCourse);
router.get('/lessons/:id', getLesson);
router.get('/search', search);

export default router;
