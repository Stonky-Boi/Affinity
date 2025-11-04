import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getComments,
    createComment,
    updateComment,
    deleteComment
} from '../controllers/comment.controller';

const router = Router();

router.get('/post/:postId', getComments);
router.post('/post/:postId', authenticateToken, createComment);
router.patch('/:id', authenticateToken, updateComment);
router.delete('/:id', authenticateToken, deleteComment);

export default router;