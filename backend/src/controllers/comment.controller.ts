import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { updateFriendship } from '../services/friendship.service';
import { Server } from 'socket.io';

export const getComments = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const comments = await prisma.comment.findMany({
            where: {
                post_id: parseInt(postId),
                parent_id: null,
                deleted_at: null,
            },
            include: {
                author: true,
                replies: {
                    where: { deleted_at: null },
                    include: {
                        author: true,
                        replies: {
                            where: { deleted_at: null },
                            include: { author: true }
                        }
                    }
                }
            },
            orderBy: { created_at: 'asc' },
        });
        res.json(comments);
    } catch (error: any) {
        res.status(500).json({ error: 'Unable to fetch comments' });
    }
};

export const createComment = async (req: AuthRequest, res: Response) => {
    try {
        const io = req.app.get('socketio') as Server;
        const redisClient = req.app.get('redisClient') as any;
        const { postId } = req.params;
        const { content, parent_id } = req.body;
        const author_id = req.user!.userId;
        const newComment = await prisma.comment.create({
            data: {
                content,
                author_id,
                post_id: parseInt(postId),
                parent_id: parent_id,
            },
            include: { author: true },
        });
        const post = await prisma.post.findUnique({ where: { id: parseInt(postId) } });
        if (post && post.author_id !== author_id) {
            await updateFriendship(author_id, post.author_id, { num_comments: { increment: 1 } });
            try {
                const authorSocketId = await redisClient.get(`userSocket:${post.author_id}`);
                if (authorSocketId) {
                    const commentAuthor = await prisma.user.findUnique({ where: { id: author_id }, select: { username: true } });
                    io.to(authorSocketId).emit('receive_notification', {
                        message: `${commentAuthor?.username || 'Someone'} commented on your post.`,
                        type: 'NEW_COMMENT'
                    });
                }
            } catch (err) {
                console.error("Notification emit error (comment):", err);
            }
        }
        res.json(newComment);
    } catch (error: any) {
        console.error("Failed to create comment. Error:", error);
        res.status(500).json({ error: 'Unable to create comment. See server logs for details.' });
    }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
    try {
        const commentId = parseInt(req.params.id);
        const { content } = req.body;
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (comment!.author_id !== req.user!.userId) {
            return res.status(403).json({ error: "You can only edit your own comments." });
        }
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
        });
        res.json(updatedComment);
    } catch (error: any) {
        res.status(500).json({ error: "Unable to update comment." });
    }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const commentId = parseInt(req.params.id);
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (comment!.author_id !== req.user!.userId) {
            return res.status(403).json({ error: "You can only delete your own comments." });
        }
        await prisma.comment.update({
            where: { id: commentId },
            data: { deleted_at: new Date() },
        });
        res.json({ message: 'Comment deleted successfully.' });
    } catch (error: any) {
        res.status(500).json({ error: "Unable to delete comment." });
    }
};