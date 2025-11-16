import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const toggleBlock = async (req: AuthRequest, res: Response) => {
    try {
        const blocker_id = req.user!.userId;
        const blocked_id = parseInt(req.params.id);
        if (blocker_id === blocked_id) {
            return res.status(400).json({ error: "You cannot block yourself." });
        }
        const existingBlock = await prisma.block.findUnique({
            where: { blocker_id_blocked_id: { blocker_id, blocked_id } }
        });
        if (existingBlock) {
            await prisma.block.delete({
                where: { blocker_id_blocked_id: { blocker_id, blocked_id } }
            });
            res.json({ message: "User unblocked." });
        } else {
            // User is not blocked, so block them
            await prisma.block.create({
                data: { blocker_id, blocked_id }
            });
            // When A blocks B, they unfollow each other.
            // Handled in trigger in the database.
            // (You might also want to remove them from conversations, etc.)
            res.json({ message: "User blocked." });
        }
    } catch (error: any) {
        res.status(500).json({ error: "Could not process block request." });
    }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
    try {
        const blocker_id = req.user!.userId;
        const blocks = await prisma.block.findMany({
            where: { blocker_id: blocker_id },
            include: {
                blocked: {
                    select: {
                        id: true,
                        username: true,
                        picture_url: true
                    }
                }
            }
        });
        const blockedUsers = blocks.map(b => b.blocked);
        res.json(blockedUsers);
    } catch (error: any) {
        res.status(500).json({ error: "Could not fetch blocked users." });
    }
};