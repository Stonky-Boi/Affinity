import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    createPost,
    getAllPosts,
    getFeed,
    updatePost,
    deletePost,
    getReactions,
    processReaction
} from '../controllers/post.controller';

const router = Router();

router.post('/', authenticateToken, createPost);
router.get('/', getAllPosts);
router.get('/feed', authenticateToken, getFeed);
router.patch('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

router.get('/:postId/reactions', getReactions);
router.post('/:postId/reactions', authenticateToken, processReaction);

export default router;