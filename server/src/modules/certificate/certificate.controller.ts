import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { prisma } from '../../db/prisma.js';
import { getProgressOverview } from '../progress/progress.service.js';

// GET /api/certificate/:slug — trả dữ liệu chứng chỉ nếu khoá đã hoàn thành 100%.
export const getCertificate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const slug = z.string().min(1).parse(req.params.slug);

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) throw AppError.notFound('Không tìm thấy khoá học.');

  const overview = await getProgressOverview(req.user.sub);
  const courseProgress = overview.find((c) => c.courseId === course.id);

  if (!courseProgress || courseProgress.total === 0 || courseProgress.percent < 100) {
    throw AppError.badRequest('Bạn cần hoàn thành 100% khoá học để nhận chứng chỉ.');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { displayName: true },
  });

  // Mã chứng chỉ đơn giản để tra cứu/đối chiếu.
  const code = `LPP-${course.slug.toUpperCase()}-${req.user.sub.slice(-6).toUpperCase()}`;

  res.json({
    learnerName: user?.displayName ?? 'Người học',
    courseTitle: course.title,
    issuedAt: new Date().toISOString(),
    code,
  });
});
