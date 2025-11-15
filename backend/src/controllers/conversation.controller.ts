import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getBlockedUserIds } from '../services/block.service';
import prisma from '../db';
import { Role } from '@prisma/client';

export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        const otherBlockedIds = blockedUserIds.filter(id => id !== currentUserId);
        const participants = await prisma.participant.findMany({
            where: { user_id: currentUserId },
            select: { conversation_id: true }
        });
        const conversationIds = participants.map(p => p.conversation_id);
        const conversations = await prisma.conversation.findMany({
            where: {
                id: { in: conversationIds },
                participants: {
                    none: {
                        user_id: { in: otherBlockedIds }
                    }
                }
            },
            include: {
                participants: {
                    where: {
                        user_id: { notIn: otherBlockedIds }
                    },
                    include: {
                        user: {
                            select: { id: true, username: true, picture_url: true }
                        }
                    }
                },
                messages: {
                    where: { deleted_at: null },
                    orderBy: { created_at: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: { id: true, username: true }
                        }
                    }
                }
            }
        });
        res.json(conversations);
    } catch (error: any) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: 'Unable to fetch conversations' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        if (isNaN(conversationId)) {
            return res.status(400).json({ error: 'Invalid conversation ID.' });
        }
        const messages = await prisma.message.findMany({
            where: {
                conversation_id: conversationId,
                deleted_at: null
            },
            include: {
                sender: {
                    select: { id: true, username: true, picture_url: true }
                }
            },
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
        const allParticipantIds = [...new Set([initiator_id, ...participant_ids.map(id => parseInt(id))])];
        allParticipantIds.sort((a, b) => a - b);
        const isGroup = allParticipantIds.length > 2;
        if (!isGroup) {
            const existingConversation = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    AND: [
                        { participants: { some: { user_id: allParticipantIds[0] } } },
                        { participants: { some: { user_id: allParticipantIds[1] } } },
                        { participants: { none: { user_id: { notIn: allParticipantIds } } } }
                    ]
                },
            });
            if (existingConversation) {
                const convoWithData = await prisma.conversation.findUnique({
                    where: { id: existingConversation.id },
                    include: { 
                        participants: { 
                            include: { 
                                user: {
                                    select: { id: true, username: true, picture_url: true }
                                } 
                            } 
                        } 
                    }
                });
                return res.json(convoWithData);
            }
        }
        const newConversation = await prisma.conversation.create({
            data: {
                name: isGroup ? (name || 'New Group') : null,
                type: isGroup ? 'GROUP' : 'DIRECT',
                participants: {
                    create: allParticipantIds.map(userId => ({
                        user_id: userId,
                        role: (isGroup && userId === initiator_id) ? Role.ADMIN : Role.MEMBER
                    }))
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, picture_url: true }
                        }
                    }
                }
            }
        });
        res.json(newConversation);
    } catch (error: any) {
        console.error("Error starting conversation:", error);
        res.status(500).json({ error: 'Unable to start conversation' });
    }
};

export const getConversationDetails = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, picture_url: true }
                        }
                    }
                }
            }
        });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: "Failed to get conversation details." });
    }
};

export const updateConversationDetails = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        const { name, picture_url } = req.body;
        const updatedConversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                name: name,
                picture_url: picture_url
            }
        });
        res.json(updatedConversation);
    } catch (error) {
        res.status(500).json({ error: "Failed to update conversation." });
    }
};

export const addParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }
        const newParticipant = await prisma.participant.create({
            data: {
                conversation_id: conversationId,
                user_id: parseInt(userId),
                role: Role.MEMBER
            }
        });
        res.json(newParticipant);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'User is already in this conversation.' });
        }
        res.status(500).json({ error: "Failed to add participant." });
    }
};

export const removeParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        const userIdToRemove = parseInt(req.params.userId);
        const currentUserId = req.user!.userId;
        if (userIdToRemove === currentUserId) {
            return res.status(400).json({ error: "You cannot kick yourself. Use 'Leave Group' instead." });
        }
        await prisma.participant.delete({
            where: {
                user_id_conversation_id: {
                    user_id: userIdToRemove,
                    conversation_id: conversationId
                }
            }
        });
        res.json({ message: "Participant removed." });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove participant." });
    }
};

export const leaveConversation = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        const userId = req.user!.userId;
        await prisma.participant.delete({
            where: {
                user_id_conversation_id: {
                    user_id: userId,
                    conversation_id: conversationId
                }
            }
        });
        // Optional: If you were the last admin, promote someone else
        // (We can add this logic later)
        res.json({ message: "You have left the conversation." });
    } catch (error) {
        res.status(500).json({ error: "Failed to leave conversation." });
    }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        // The schema (onDelete: Cascade) will automatically delete all
        // Participants and Messages associated with this conversation.
        await prisma.conversation.delete({
            where: { id: conversationId }
        });
        res.json({ message: "Conversation deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete conversation." });
    }
};

export const changeParticipantRole = async (req: AuthRequest, res: Response) => {
    try {
        const conversationId = parseInt(req.params.convoId);
        const userIdToChange = parseInt(req.params.userId);
        const { role } = req.body; // "ADMIN" or "MEMBER"
        if (!Object.values(Role).includes(role)) {
            return res.status(400).json({ error: "Invalid role specified." });
        }
        const updatedParticipant = await prisma.participant.update({
            where: {
                user_id_conversation_id: {
                    user_id: userIdToChange,
                    conversation_id: conversationId
                }
            },
            data: { role: role }
        });
        res.json(updatedParticipant);
    } catch (error) {
        res.status(500).json({ error: "Failed to change role." });
    }
};