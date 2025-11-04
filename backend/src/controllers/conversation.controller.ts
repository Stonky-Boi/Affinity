import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const followingResult = await prisma.follows.findMany({
            where: { follower_id: currentUserId },
            select: { following_id: true }
        });
        const followingIds = followingResult.map((f: any) => f.following_id);

        const mutualsResult = await prisma.follows.findMany({
            where: {
                following_id: currentUserId,
                follower_id: { in: followingIds }
            },
            select: { follower_id: true }
        });
        const mutualIds = mutualsResult.map((m: any) => m.follower_id);

        const conversations = await prisma.conversation.findMany({
            where: {
                AND: [
                    { participants: { some: { id: currentUserId } } },
                    { participants: { some: { id: { in: mutualIds } } } }
                ]
            },
            include: {
                participants: true,
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1,
                    include: { sender: true }
                }
            }
        });
        res.json(conversations);
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to fetch conversations' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const messages = await prisma.message.findMany({
            where: { conversation_id: conversationId },
            include: { sender: true },
            orderBy: { created_at: 'asc' }
        });
        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to fetch messages' });
    }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { participant_ids, name } = req.body;
        const initiator_id = req.user!.userId;
        if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
            return res.status(400).json({ error: "Participant IDs are required." });
        }
        const allParticipantIds = [...new Set([initiator_id, ...participant_ids])];
        allParticipantIds.sort();

        let conversationToReturn = null;
        if (allParticipantIds.length === 2) {
            const existingOneOnOne = await prisma.conversation.findFirst({
                where: {
                    participants: { every: { id: { in: allParticipantIds } } },
                },
                include: { participants: true }
            });
            if (existingOneOnOne) {
                conversationToReturn = existingOneOnOne;
            }
        }
        if (!conversationToReturn) {
            const participantConnections = allParticipantIds.map(id => ({ id: id }));
            const newConversation = await prisma.conversation.create({
                data: {
                    name: allParticipantIds.length > 2 ? name : null,
                    participants: {
                        connect: participantConnections,
                    },
                },
                include: { participants: true }
            });
            conversationToReturn = newConversation;
        }
        res.json(conversationToReturn);
    } catch (error: any) {
        console.error("Error starting conversation:", error);
        res.status(500).json({ error: 'Unable to start conversation' });
    }
};