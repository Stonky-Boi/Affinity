import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getAllUsers,
    searchUsers,
    getMutuals,
    getMutualsWithViewer,
    getUserProfile,
    updateUserProfile,
    getFollowers,
    getFollowing
} from '../controllers/user.controller';

const router = Router();

router.get('/', getAllUsers);
router.get('/search', authenticateToken, searchUsers);
router.get('/mutuals', authenticateToken, getMutuals);
router.get('/:username/mutuals-with-viewer', authenticateToken, getMutualsWithViewer);
router.get('/:username', getUserProfile);
router.patch('/profile', authenticateToken, updateUserProfile);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

export default router;