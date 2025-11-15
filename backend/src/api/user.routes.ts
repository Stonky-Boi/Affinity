import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    deleteUser,
    getAllUsers,
    getSuggestedUsers,
    searchUsers,
    getMutuals,
    getMutualsWithScore,
    getUserProfile,
    updateUserProfile,
    getFollowers,
    getFollowing
} from '../controllers/user.controller';

const router = Router();

router.get('/', getAllUsers);
router.get('/suggestions', authenticateToken, getSuggestedUsers);
router.get('/search', authenticateToken, searchUsers);
router.get('/mutuals', authenticateToken, getMutuals);
router.patch('/profile', authenticateToken, updateUserProfile);
router.delete('/profile', authenticateToken, deleteUser);

router.get('/:username', authenticateToken, getUserProfile);
router.get('/:username/mutuals-with-viewer', authenticateToken, getMutualsWithScore);
router.get('/:id/followers', authenticateToken, getFollowers);
router.get('/:id/following', authenticateToken, getFollowing);

export default router;