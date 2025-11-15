import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const deleteMessage = async (req: AuthRequest, res: Response) => {
    try {
        const messageId = parseInt(req.params.id);
        const userId = req.user!.userId;
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                conversation: {
                    include: { participants: true }
                }
            }
        });
        if (!message) {
            return res.status(404).json({ error: "Message not found." });
        }
        const participant = message.conversation.participants.find(p => p.user_id === userId);
        if (message.sender_id !== userId && participant?.role !== 'ADMIN') {
            return res.status(403).json({ error: "You do not have permission to delete this message." });
        }
        await prisma.message.update({
            where: { id: messageId },
            data: {
                deleted_at: new Date(),
                content: "This message was deleted."
            }
        });
        res.json({ message: "Message deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete message." });
    }
};