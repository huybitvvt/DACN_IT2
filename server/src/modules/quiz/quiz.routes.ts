import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { getQuiz, submitQuiz } from './quiz.controller.js';

const router = Router();

router.get('/lessons/:id/quiz', getQuiz);
router.post('/quizzes/:id/submit', optionalAuth, submitQuiz);

export default router;
