import { Server } from 'socket.io';
import { updateFriendship } from '../services/friendship.service';
import prisma from '../db';

export const handleSocketEvents = (io: Server) => {
    io.on('connection', (socket: any) => {
        console.log('a user connected:', socket.id);

        socket.on('join_conversation', (conversationId: any) => {
            socket.join(conversationId);
            console.log(`User ${socket.id} joined conversation ${conversationId}`);
        });

        socket.on('send_message', async (data: any) => {
            try {
                const { content, sender_id, conversation_id } = data;
                const convoIdInt = parseInt(conversation_id);
                if (isNaN(convoIdInt)) {
                    throw new Error("Invalid conversation_id format.");
                }

                const conversation = await prisma.conversation.findUnique({
                    where: { id: convoIdInt },
                    include: { participants: true },
                });

                if (!conversation) {
                    throw new Error("Conversation not found.");
                }

                const recipient = conversation.participants.find((p: any) => p.id !== sender_id);
                if (recipient) {
                    await updateFriendship(sender_id, recipient.id, { num_messages: { increment: 1 } });
                }

                const newMessage = await prisma.message.create({
                    data: { content, sender_id, conversation_id: convoIdInt },
                    include: { sender: true },
                });

                io.to(conversation_id).emit('receive_message', newMessage);
            } catch (error: any) {
                console.error("Error in send_message:", error);
            }
        });

        socket.on('disconnect', () => {
            console.log('user disconnected:', socket.id);
        });
    });
};