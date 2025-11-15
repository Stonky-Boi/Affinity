import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../db';
import { Role } from '@prisma/client';

export const isConversationMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const conversationId = parseInt(req.params.convoId);
        if (isNaN(conversationId)) {
            return res.status(400).json({ error: 'Invalid conversation ID.' });
        }
        const participant = await prisma.participant.findUnique({
            where: {
                user_id_conversation_id: {
                    user_id: userId,
                    conversation_id: conversationId,
                }
            }
        });
        if (!participant) {
            return res.status(403).json({ error: 'You are not a member of this conversation.' });
        }
        (req as any).participant = participant;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify conversation membership.' });
    }
};

export const isConversationAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    const participant = (req as any).participant;
    if (!participant) {
        return res.status(403).json({ error: 'Membership not verified.' });
    }
    if (participant.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'You must be an admin to perform this action.' });
    }
    next();
};