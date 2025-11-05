import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { toggleBlock, getBlockedUsers } from '../controllers/block.controller';

const router = Router();

router.get('/list', authenticateToken, getBlockedUsers);
router.post('/user/:id', authenticateToken, toggleBlock);

export default router;