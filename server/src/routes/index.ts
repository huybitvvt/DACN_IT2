import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from '../modules/auth/auth.routes.js';
import contentRouter from '../modules/content/content.routes.js';
import runRouter from '../modules/run/run.routes.js';
import exerciseRouter from '../modules/exercise/exercise.routes.js';
import quizRouter from '../modules/quiz/quiz.routes.js';
import progressRouter from '../modules/progress/progress.routes.js';
import gamificationRouter from '../modules/gamification/gamification.routes.js';
import aiRouter from '../modules/ai/ai.routes.js';
import adminRouter from '../modules/admin/admin.routes.js';
import certificateRouter from '../modules/certificate/certificate.routes.js';
import leaderboardRouter from '../modules/leaderboard/leaderboard.routes.js';
import engagementRouter from '../modules/engagement/engagement.routes.js';
import paymentRouter from '../modules/payment/payment.routes.js';
import contestRouter from '../modules/contest/contest.routes.js';
import retentionRouter from '../modules/retention/retention.routes.js';
import notificationRouter from '../modules/notification/notification.routes.js';
import learningProfileRouter from '../modules/learning-profile/learning-profile.routes.js';

// Router gốc cho toàn bộ API.
const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use(contentRouter);
apiRouter.use(runRouter);
apiRouter.use(exerciseRouter);
apiRouter.use(quizRouter);
apiRouter.use(progressRouter);
apiRouter.use(gamificationRouter);
apiRouter.use(aiRouter);
apiRouter.use(certificateRouter);
apiRouter.use(leaderboardRouter);
apiRouter.use(contestRouter);
apiRouter.use(retentionRouter);
apiRouter.use(notificationRouter);
apiRouter.use(learningProfileRouter);
apiRouter.use(engagementRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use(paymentRouter);

export default apiRouter;
