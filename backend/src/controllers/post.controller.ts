import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { updateFriendship } from '../services/friendship.service';
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
    try {
        const posts = await prisma.post.findMany({
            where: { deleted_at: null },
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
    try {
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { user_a_id: currentUserId },
                    { user_b_id: currentUserId },
                ],
            },
        });
        const friendshipScores = new Map<number, number>();
        friendships.forEach((f: any) => {
            const otherUserId = f.user_a_id === currentUserId ? f.user_b_id : f.user_a_id;
            friendshipScores.set(otherUserId, f.friend_score || 0);
        });

        const allPosts = await prisma.post.findMany({
            where: {
                deleted_at: null,
            },
            include: { author: true },
            orderBy: { created_at: 'desc' },
        });

        allPosts.sort((postA: any, postB: any) => {
            const dateA = postA.created_at.toISOString().split('T')[0];
            const dateB = postB.created_at.toISOString().split('T')[0];

            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;

            const getPostScore = (post: any) => {
                if (post.author_id === currentUserId) {
                    return Infinity;
                }
                return friendshipScores.get(post.author_id) || 0;
            };

            const scoreA = getPostScore(postA);
            const scoreB = getPostScore(postB);

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            const timeA = new Date(postA.created_at).getTime();
            const timeB = new Date(postB.created_at).getTime();

            return timeB - timeA;
        });

        res.json(allPosts);
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
        const io = req.app.get('socketio') as Server;
        const redisClient = req.app.get('redisClient') as any;
        const postId = parseInt(req.params.postId);
        if (isNaN(postId)) {
            return res.status(400).json({ error: "Invalid Post ID." });
        }
        const userId = req.user!.userId;
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
                await updateFriendship(userId, post.author_id, { num_reactions: { increment: 1 } });
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