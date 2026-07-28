-- Support rolling retention and competition queries as learner activity grows.
CREATE INDEX "CoursePurchase_status_userId_idx"
ON "CoursePurchase"("status", "userId");

CREATE INDEX "ContestAttempt_contestId_status_userId_idx"
ON "ContestAttempt"("contestId", "status", "userId");

CREATE INDEX "Submission_userId_status_createdAt_idx"
ON "Submission"("userId", "status", "createdAt");

CREATE INDEX "QuizAttempt_userId_createdAt_idx"
ON "QuizAttempt"("userId", "createdAt");

CREATE INDEX "Progress_userId_completed_completedAt_idx"
ON "Progress"("userId", "completed", "completedAt");
