import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { Server } from 'socket.io';

export const processFollowRequest = async (req: AuthRequest, res: Response) => {
    try {
        const follower_id = req.user!.userId;
        const following_id = parseInt(req.params.id);
        const blocked = await prisma.block.findFirst({
            where: {
                OR: [
                    { blocker_id: follower_id, blocked_id: following_id },
                    { blocker_id: following_id, blocked_id: follower_id }
                ]
            }
        });
        if (blocked) {
            return res.status(403).json({ error: "You cannot follow someone who blocked you, or whom you blocked." });
        }
        const io = req.app.get('socketio') as Server;
        const redisClient = req.app.get('redisClient') as any;
        if (follower_id === following_id) {
            return res.status(400).json({ error: "You cannot follow yourself." });
        }
        const existingFollow = await prisma.follows.findUnique({
            where: { follower_id_following_id: { follower_id, following_id } },
        });
        if (existingFollow) {
            await prisma.follows.delete({
                where: { follower_id_following_id: { follower_id, following_id } },
            });
            res.json({ message: 'Unfollowed user or canceled request.' });
        } else {
            const userToFollow = await prisma.user.findUnique({
                where: { id: following_id },
                select: { settings: true }
            });
            const isPrivate = userToFollow?.settings?.is_private === true;
            const status = isPrivate ? 'pending' : 'accepted';
            await prisma.follows.create({
                data: { follower_id, following_id, status: status },
            });
            if (isPrivate) {
                try {
                    const followedUserSocketId = await redisClient.get(`userSocket:${following_id}`);
                    if (followedUserSocketId) {
                        const followerUser = await prisma.user.findUnique({ where: { id: follower_id }, select: { username: true } });
                        io.to(followedUserSocketId).emit('receive_notification', {
                            message: `${followerUser?.username || 'Someone'} sent you a follow request.`,
                            type: 'NEW_FOLLOWER'
                        });
                    }
                } catch (err) {
                    console.error("Notification emit error (follow req):", err);
                }
                res.json({ message: 'Follow request sent.' });
            } else {
                const otherUserFollowsBack = await prisma.follows.findFirst({
                    where: {
                        follower_id: following_id,
                        following_id: follower_id,
                        status: 'accepted'
                    }
                });
                if (otherUserFollowsBack) {
                    const userA = Math.min(follower_id, following_id);
                    const userB = Math.max(follower_id, following_id);
                    await prisma.friendship.upsert({
                        where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
                        create: { user_a_id: userA, user_b_id: userB },
                        update: {}
                    });
                }
                try {
                    const followedUserSocketId = await redisClient.get(`userSocket:${following_id}`);
                    if (followedUserSocketId) {
                        const followerUser = await prisma.user.findUnique({ where: { id: follower_id }, select: { username: true } });
                        io.to(followedUserSocketId).emit('receive_notification', {
                            message: `${followerUser?.username || 'Someone'} started following you.`,
                            type: 'NEW_FOLLOWER'
                        });
                    }
                } catch (err) {
                    console.error("Notification emit error (public follow):", err);
                }
                res.json({ message: 'User followed successfully.' });
            }
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
        const io = req.app.get('socketio') as Server;
        const redisClient = req.app.get('redisClient') as any;
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
            const iFollowThem = await prisma.follows.findFirst({
                where: {
                    follower_id: currentUserId,
                    following_id: follower_id,
                    status: 'accepted'
                }
            });
            if (iFollowThem) {
                const userA = Math.min(currentUserId, follower_id);
                const userB = Math.max(currentUserId, follower_id);
                await prisma.friendship.upsert({
                    where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
                    create: { user_a_id: userA, user_b_id: userB },
                    update: {}
                });
            }
            try {
                const followerSocketId = await redisClient.get(`userSocket:${follower_id}`);
                if (followerSocketId) {
                    io.to(followerSocketId).emit('receive_notification', {
                        message: `${req.user!.username} accepted your follow request.`, // We need to fetch username, but this is ok
                        type: 'FOLLOW_ACCEPTED'
                    });
                }
            } catch (err) {
                console.error("Notification emit error (follow accept):", err);
            }
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