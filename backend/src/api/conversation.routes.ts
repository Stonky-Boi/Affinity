import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getConversations,
    getMessages,
    createConversation
} from '../controllers/conversation.controller';

const router = Router();

router.get('/', authenticateToken, getConversations);
router.post('/', authenticateToken, createConversation);
router.get('/:id/messages', authenticateToken, getMessages);

export default router;