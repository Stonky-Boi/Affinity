import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { getBlockedUserIds } from '../services/block.service';
import { Server } from 'socket.io';

export const getComments = async (req: Request, res: Response) => {
  const currentUserId = (req as AuthRequest).user?.userId;
  let blockedUserIds: number[] = [];
  if (currentUserId) {
    blockedUserIds = await getBlockedUserIds(currentUserId);
  }
  try {
    const { postId } = req.params;
    const comments = await prisma.comment.findMany({
      where: {
        post_id: parseInt(postId),
        parent_id: null,
        deleted_at: null,
        author_id: { notIn: blockedUserIds }
      },
      include: {
        author: true,
        replies: {
          where: {
            deleted_at: null,
            author_id: { notIn: blockedUserIds }
          },
          include: {
            author: true,
            replies: {
              where: {
                deleted_at: null,
                author_id: { notIn: blockedUserIds }
              },
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
    const { postId } = req.params;
    const author_id = req.user!.userId;
    const post = await prisma.post.findUnique({ where: { id: parseInt(postId) } });
    if (!post) return res.status(404).json({ error: "Post not found." });
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blocker_id: author_id, blocked_id: post.author_id },
          { blocker_id: post.author_id, blocked_id: author_id }
        ]
      }
    });
    if (blocked) {
      return res.status(403).json({ error: "You cannot interact with this user's content." });
    }
    const io = req.app.get('socketio') as Server;
    const redisClient = req.app.get('redisClient') as any;
    const { content, parent_id } = req.body;
    const authorUsername = req.user!.username;
    const newComment = await prisma.comment.create({
      data: { content, author_id, post_id: parseInt(postId), parent_id },
      include: { author: true },
    });
    if (post && post.author_id !== author_id) {
      try {
        const authorSocketId = await redisClient.get(`userSocket:${post.author_id}`);
        if (authorSocketId) {
          io.to(authorSocketId).emit('receive_notification', {
            message: `${authorUsername || 'Someone'} commented on your post.`,
            type: 'NEW_COMMENT'
          });
        }
      } catch (err) { console.error("Notification emit error (comment):", err); }
    }
    if (parent_id) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parent_id }
      });
      if (parentComment &&
        parentComment.author_id !== author_id &&
        parentComment.author_id !== post?.author_id) {
        try {
          const parentAuthorSocketId = await redisClient.get(`userSocket:${parentComment.author_id}`);
          if (parentAuthorSocketId) {
            io.to(parentAuthorSocketId).emit('receive_notification', {
              message: `${authorUsername || 'Someone'} replied to your comment.`,
              type: 'NEW_REPLY'
            });
          }
        } catch (err) { console.error("Notification emit error (reply):", err); }
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