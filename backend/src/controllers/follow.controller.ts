import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';

export const processFollowRequest = async (req: AuthRequest, res: Response) => {
    try {
        const follower_id = req.user!.userId;
        const following_id = parseInt(req.params.id);
        const existingFollow = await prisma.follows.findUnique({
            where: { follower_id_following_id: { follower_id, following_id } },
        });
        if (existingFollow) {
            await prisma.follows.delete({
                where: { follower_id_following_id: { follower_id, following_id } },
            });
            res.json({ message: 'Unfollowed user or canceled request.' });
        } else {
            await prisma.follows.create({
                data: { follower_id, following_id, status: 'pending' },
            });
            res.json({ message: 'Follow request sent.' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to process follow request.' });
    }
};

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const requests = await prisma.follows.findMany({
            where: {
                following_id: currentUserId,
                status: 'pending',
            },
            include: { follower: true },
        });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to fetch pending requests.' });
    }
};

export const respondToRequest = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { follower_id, newStatus } = req.body;
        if (newStatus !== 'accepted' && newStatus !== 'declined') {
            return res.status(400).json({ error: 'Invalid status.' });
        }
        if (newStatus === 'accepted') {
            await prisma.follows.update({
                where: {
                    follower_id_following_id: { follower_id, following_id: currentUserId },
                },
                data: { status: 'accepted' },
            });
            res.json({ message: 'Follow request accepted.' });
        } else {
            await prisma.follows.delete({
                where: {
                    follower_id_following_id: { follower_id, following_id: currentUserId },
                },
            });
            res.json({ message: 'Follow request declined.' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to respond to request.' });
    }
};