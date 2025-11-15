import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    isConversationMember,
    isConversationAdmin
} from '../middleware/convoAuth';
import {
    getConversations,
    getMessages,
    createConversation,
    getConversationDetails,
    updateConversationDetails,
    addParticipant,
    removeParticipant,
    leaveConversation,
    deleteConversation,
    changeParticipantRole
} from '../controllers/conversation.controller';

const router = Router();

// --- General Routes ---
router.get('/', authenticateToken, getConversations);
router.post('/', authenticateToken, createConversation);

// --- Routes requiring Member access ---
const memberRoutes = [
    isConversationMember, 
];
router.get('/:convoId/details', authenticateToken, ...memberRoutes, getConversationDetails);
router.get('/:convoId/messages', authenticateToken, ...memberRoutes, getMessages);
router.delete('/:convoId/leave', authenticateToken, ...memberRoutes, leaveConversation);

// --- Routes requiring Admin access ---
const adminRoutes = [
    isConversationMember, 
    isConversationAdmin
];
router.patch('/:convoId/details', authenticateToken, ...adminRoutes, updateConversationDetails);
router.post('/:convoId/participants', authenticateToken, ...adminRoutes, addParticipant);
router.delete('/:convoId/participants/:userId', authenticateToken, ...adminRoutes, removeParticipant);
router.patch('/:convoId/participants/:userId/role', authenticateToken, ...adminRoutes, changeParticipantRole);
router.delete('/:convoId', authenticateToken, ...adminRoutes, deleteConversation);

export default router;