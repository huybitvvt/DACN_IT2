import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as c from './admin.controller.js';

const router = Router();

// Mọi route admin yêu cầu đăng nhập + vai trò ADMIN (Property 4).
router.use(requireAuth, requireRole('ADMIN'));

// Courses
router.get('/courses', c.listCourses);
router.post('/courses', c.createCourse);
router.put('/courses/:id', c.updateCourse);
router.delete('/courses/:id', c.deleteCourse);

// Lessons
router.get('/lessons', c.listLessons);
router.post('/lessons', c.createLesson);
router.put('/lessons/:id', c.updateLesson);
router.delete('/lessons/:id', c.deleteLesson);

// Exercises
router.get('/exercises', c.listExercises);
router.get('/exercises/:id', c.getExercise);
router.post('/exercises', c.createExercise);
router.put('/exercises/:id', c.updateExercise);
router.delete('/exercises/:id', c.deleteExercise);

// Quizzes
router.get('/quizzes/:id', c.getQuiz);
router.post('/quizzes', c.createQuiz);
router.put('/quizzes/:id', c.updateQuiz);
router.delete('/quizzes/:id', c.deleteQuiz);

// Users
router.get('/users', c.listUsers);

export default router;
