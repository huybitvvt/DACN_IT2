import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { prisma } from '../../db/prisma.js';

// ===== Ghi chú & đánh dấu (#8) =====

// GET /api/lessons/:id/note — lấy ghi chú + trạng thái bookmark của người dùng.
export const getNote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const lessonId = z.string().min(1).parse(req.params.id);
  const note = await prisma.lessonNote.findUnique({
    where: { userId_lessonId: { userId: req.user.sub, lessonId } },
    select: { content: true, bookmarked: true },
  });
  res.json({ note: note ?? { content: '', bookmarked: false } });
});

const noteSchema = z.object({
  content: z.string().max(5000).optional(),
  bookmarked: z.boolean().optional(),
});

// PUT /api/lessons/:id/note — lưu ghi chú / bật-tắt bookmark.
export const saveNote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const lessonId = z.string().min(1).parse(req.params.id);
  const input = noteSchema.parse(req.body);

  const note = await prisma.lessonNote.upsert({
    where: { userId_lessonId: { userId: req.user.sub, lessonId } },
    update: {
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.bookmarked !== undefined ? { bookmarked: input.bookmarked } : {}),
    },
    create: {
      userId: req.user.sub,
      lessonId,
      content: input.content ?? '',
      bookmarked: input.bookmarked ?? false,
    },
    select: { content: true, bookmarked: true },
  });
  res.json({ note });
});

// GET /api/bookmarks — danh sách bài học đã đánh dấu của người dùng.
export const listBookmarks = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const rows = await prisma.lessonNote.findMany({
    where: { userId: req.user.sub, bookmarked: true },
    select: {
      lesson: {
        select: { id: true, title: true, course: { select: { slug: true, title: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ bookmarks: rows.map((r) => r.lesson) });
});

// ===== Bình luận (#9) =====

// GET /api/lessons/:id/comments — danh sách bình luận của bài học.
export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const lessonId = z.string().min(1).parse(req.params.id);
  const comments = await prisma.comment.findMany({
    where: { lessonId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { displayName: true } },
    },
  });
  res.json({ comments });
});

const commentSchema = z.object({ content: z.string().min(1).max(2000) });

// POST /api/lessons/:id/comments — thêm bình luận (cần đăng nhập).
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const lessonId = z.string().min(1).parse(req.params.id);
  const { content } = commentSchema.parse(req.body);

  const comment = await prisma.comment.create({
    data: { userId: req.user.sub, lessonId, content },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { displayName: true } },
    },
  });
  res.status(201).json({ comment });
});

// DELETE /api/comments/:id — xoá bình luận của chính mình (hoặc admin).
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const id = z.string().min(1).parse(req.params.id);
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw AppError.notFound('Không tìm thấy bình luận.');
  if (comment.userId !== req.user.sub && req.user.role !== 'ADMIN') {
    throw AppError.forbidden('Bạn chỉ có thể xoá bình luận của mình.');
  }
  await prisma.comment.delete({ where: { id } });
  res.json({ success: true });
});
