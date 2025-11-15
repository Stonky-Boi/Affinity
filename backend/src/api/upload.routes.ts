import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUploadSignature } from '../controllers/upload.controller';

const router = Router();
router.get('/signature', authenticateToken, getUploadSignature);

export default router;