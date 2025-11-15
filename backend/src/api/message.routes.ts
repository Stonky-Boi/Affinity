import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { deleteMessage } from '../controllers/message.controller';

const router = Router();

// We don't need group auth middleware here, 
// the controller handles it based on message ownership
router.delete('/:id', authenticateToken, deleteMessage);

export default router;