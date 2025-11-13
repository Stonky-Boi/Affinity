import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { getFriendshipScore } from '../services/friendship.service';
import { getBlockedUserIds } from '../services/block.service';
import { Server } from 'socket.io';

export const createPost = async (req: AuthRequest, res: Response) => {
    const author_id = req.user!.userId;
    const { content } = req.body;
    try {
        const newPost = await prisma.post.create({
            data: { content, author_id },
        });
        res.json(newPost);
    } catch (error: any) {
        res.json({ error: `Unable to create post` });
    }
};

export const getAllPosts = async (req: Request, res: Response) => {
    const currentUserId = (req as AuthRequest).user?.userId;
    let blockedUserIds: number[] = [];
    if (currentUserId) {
        blockedUserIds = await getBlockedUserIds(currentUserId);
    }
    try {
        const posts = await prisma.post.findMany({
            where: {
                deleted_at: null,
                author_id: { notIn: blockedUserIds }
            },
            include: { author: true },
            orderBy: { created_at: 'desc' },
        });
        res.json(posts);
    } catch (error: any) {
        res.status(500).json({ error: `Unable to fetch posts` });
    }
};

export const getFeed = async (req: AuthRequest, res: Response) => {
    const currentUserId = req.user!.userId;
    const { sort } = req.query;
    try {
        const blockedUserIds = await getBlockedUserIds(currentUserId);
        const following = await prisma.follows.findMany({
            where: { follower_id: currentUserId, status: 'accepted' },
            select: { following_id: true }
        });
        const followingIds = following.map(f => f.following_id);
        const feedUserIds = [...followingIds, currentUserId];

        const posts = await prisma.post.findMany({
            where: {
                deleted_at: null,
                author_id: { in: feedUserIds, notIn: blockedUserIds }
            },
            include: { author: true },
            orderBy: { created_at: 'desc' },
        });

        if (sort === 'chronological') {
            return res.json(posts);
        }
        const authors = [...new Set(posts.map(p => p.author_id))];
        const friendshipScores = new Map<number, number>();
        await Promise.all(authors.map(async (authorId) => {
            if (authorId === currentUserId) return;
            const score = await getFriendshipScore(currentUserId, authorId);
            friendshipScores.set(authorId, score);
        }));
        posts.sort((postA: any, postB: any) => {
            const dateA = postA.created_at.toISOString().split('T')[0];
            const dateB = postB.created_at.toISOString().split('T')[0];
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            const getPostScore = (post: any) => {
                if (post.author_id === currentUserId) return Infinity;
                return friendshipScores.get(post.author_id) || 0;
            };
            const scoreA = getPostScore(postA);
            const scoreB = getPostScore(postB);
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }
            return new Date(postB.created_at).getTime() - new Date(postA.created_at).getTime();
        });
        res.json(posts);
    } catch (error: any) {
        console.error("Error fetching prioritized feed:", error);
        res.status(500).json({ error: 'Unable to fetch feed.' });
    }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
    try {
        const postId = parseInt(req.params.id);
        const { content } = req.body;
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (post!.author_id !== req.user!.userId) {
            return res.status(403).json({ error: "You can only edit your own posts." });
        }
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { content },
        });
        res.json(updatedPost);
    } catch (error: any) {
        res.status(500).json({ error: "Unable to update post." });
    }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
    try {
        const postId = parseInt(req.params.id);
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (post!.author_id !== req.user!.userId) {
            return res.status(403).json({ error: "You can only delete your own posts." });
        }
        await prisma.post.update({
            where: { id: postId },
            data: { deleted_at: new Date() },
        });
        res.json({ message: 'Post deleted successfully.' });
    } catch (error: any) {
        res.status(500).json({ error: "Unable to delete post." });
    }
};

export const getReactions = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const reactions = await prisma.reaction.findMany({
            where: { post_id: parseInt(postId) },
        });
        res.json(reactions);
    } catch (error: any) {
        res.json({ error: 'Unable to fetch reactions' });
    }
};

export const processReaction = async (req: AuthRequest, res: Response) => {
    try {
        const postId = parseInt(req.params.postId);
        const userId = req.user!.userId;
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: "Post not found." });
        const blocked = await prisma.block.findFirst({
            where: {
                OR: [
                    { blocker_id: userId, blocked_id: post.author_id },
                    { blocker_id: post.author_id, blocked_id: userId }
                ]
            }
        });
        if (blocked) {
            return res.status(403).json({ error: "You cannot interact with this user's content." });
        }
        const io = req.app.get('socketio') as Server;
        const redisClient = req.app.get('redisClient') as any;
        if (isNaN(postId)) {
            return res.status(400).json({ error: "Invalid Post ID." });
        }
        const { reaction_type } = req.body;
        if (!reaction_type || typeof reaction_type !== 'string') {
            return res.status(400).json({ error: "Invalid reaction type provided." });
        }
        const existingReaction = await prisma.reaction.findUnique({
            where: { user_id_post_id: { user_id: userId, post_id: postId } },
        });
        if (existingReaction) {
            if (existingReaction.reaction_type === reaction_type) {
                await prisma.reaction.delete({ where: { id: existingReaction.id } });
                return res.json({ message: 'Reaction removed' });
            } else {
                const updatedReaction = await prisma.reaction.update({
                    where: { id: existingReaction.id },
                    data: { reaction_type },
                });
                return res.json(updatedReaction);
            }
        } else {
            const newReaction = await prisma.reaction.create({
                data: { user_id: userId, post_id: postId, reaction_type },
            });
            const post = await prisma.post.findUnique({ where: { id: postId } });
            if (post && post.author_id !== userId) {
                try {
                    const authorSocketId = await redisClient.get(`userSocket:${post.author_id}`);
                    if (authorSocketId) {
                        const reactionAuthor = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
                        io.to(authorSocketId).emit('receive_notification', {
                            message: `${reactionAuthor?.username || 'Someone'} reacted to your post.`,
                            type: 'NEW_REACTION'
                        });
                    }
                } catch (err) {
                    console.error("Notification emit error (reaction):", err);
                }
            }
            return res.json(newReaction);
        }
    } catch (error: any) {
        console.error("Error processing reaction:", error);
        res.status(500).json({ error: 'Unable to process reaction' });
    }
};