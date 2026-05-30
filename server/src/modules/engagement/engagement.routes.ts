import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  addComment,
  deleteComment,
  getNote,
  listBookmarks,
  listComments,
  saveNote,
} from './engagement.controller.js';

const router = Router();

// Ghi chú & bookmark
router.get('/lessons/:id/note', requireAuth, getNote);
router.put('/lessons/:id/note', requireAuth, saveNote);
router.get('/bookmarks', requireAuth, listBookmarks);

// Bình luận
router.get('/lessons/:id/comments', listComments);
router.post('/lessons/:id/comments', requireAuth, addComment);
router.delete('/comments/:id', requireAuth, deleteComment);

export default router;
