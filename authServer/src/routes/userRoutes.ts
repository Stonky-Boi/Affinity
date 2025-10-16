import { Router } from "express";
import { authenticateToken } from "src/middleware/auth.ts";
import * as userController from "../controllers/userController.ts"

const router = Router();

router.post('/follow/:id', authenticateToken, userController.follow);
router.get('/followers/:id', authenticateToken, userController.getFollowers);
router.get('/following/:id', authenticateToken, userController.getFollowing);

export default router;
