import { Server } from 'socket.io';
import prisma from '../db';
import redisClient from '../redis';
import jwt from 'jsonwebtoken';
import { updateFriendshipCounters } from '../services/friendship.service';

interface AuthenticatedSocket extends NodeJS.EventEmitter {
    id: string;
    userId?: number;
    join(room: string): void;
    on(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
}

export const handleSocketEvents = (io: Server) => {
    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join_conversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined room ${conversationId}`);
        });

        socket.on('authenticate', async (token: string) => {
            if (!token) {
                return console.error("Socket Auth: No token provided");
            }
            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
                const userId = payload.userId;
                // Attach userId to the socket object for easy lookup on disconnect
                socket.userId = userId;
                // Store in Redis: "userSocket:123" -> "abcSocketIdXYZ"
                await redisClient.set(`userSocket:${userId}`, socket.id);
                console.log(`Socket Auth: User ${userId} mapped to socket ${socket.id}`);
            } catch (err) {
                console.error("Socket Auth: Invalid token", err);
            }
        });

        socket.on('send_message', async (data: any) => {
            try {
                const { content, sender_id, conversation_id } = data;
                const convoIdInt = parseInt(conversation_id);
                if (isNaN(convoIdInt)) {
                    throw new Error("Invalid conversation_id format.");
                }
                const newMessage = await prisma.message.create({
                    data: { content, sender_id, conversation_id: convoIdInt },
                    include: { sender: true },
                });

                // --- START: FRIENDSHIP COUNTER ---
                const conversation = await prisma.conversation.findUnique({
                    where: { id: convoIdInt },
                    include: { participants: { select: { id: true } } }
                });

                if (conversation && conversation.participants.length === 2) {
                    const otherUser = conversation.participants.find(p => p.id !== sender_id);
                    if (otherUser) {
                        await updateFriendshipCounters(sender_id, otherUser.id, 'num_messages', 'increment');
                    }
                }
                io.to(conversation_id).emit('receive_message', newMessage);
            } catch (error: any) {
                console.error("Error in send_message:", error);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (socket.userId) {
                try {
                    // Remove the mapping from Redis
                    await redisClient.del(`userSocket:${socket.userId}`);
                    console.log(`Socket Cache: Removed user ${socket.userId}`);
                } catch (err) {
                    console.error("Redis DEL error on disconnect:", err);
                }
            }
        });
    });
};