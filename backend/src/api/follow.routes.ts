import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    processFollowRequest,
    getPendingRequests,
    respondToRequest
} from '../controllers/follow.controller';

const router = Router();

router.post('/user/:id', authenticateToken, processFollowRequest);
router.get('/pending', authenticateToken, getPendingRequests);
router.patch('/respond', authenticateToken, respondToRequest);

export default router;