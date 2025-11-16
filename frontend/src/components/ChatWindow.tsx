import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import type { Message, NewMessageData, ChatWindowProps, Conversation } from '../types';
import { SkeletonLoader } from './SkeletonLoader';
import ChatHeader from './ChatHeader';
import ConfirmationModal from './ConfirmationModal';
import GroupInfoModal from './GroupInfoModal';
import { Trash2 } from 'lucide-react';

function ChatWindow({ conversationId, onClose }: ChatWindowProps) {
    const { user, token, socket } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isDeleteConvoModalOpen, setIsDeleteConvoModalOpen] = useState(false);
    const [isDeletingConvo, setIsDeletingConvo] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | number | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const { data: messages, isLoading: isLoadingMessages, error: messagesError, refresh: refreshMessages } = useApi<Message[]>(
        conversationId ? `/api/conversations/${conversationId}/messages` : null,
        { skip: !conversationId }
    );

    const { data: conversation, isLoading: isLoadingConvo, error: convoError, refresh: refreshConversation } = useApi<Conversation>(
        conversationId ? `/api/conversations/${conversationId}/details` : null,
        { skip: !conversationId }
    );

    const myRole = conversation?.participants.find(p => p.user_id === user?.id)?.role;

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (!socket || !conversationId) return;
        socket.emit('join_conversation', conversationId);
        const handleReceiveMessage = (incomingMessage: Message) => {
            if (String(incomingMessage.conversation_id) === String(conversationId)) {
                refreshMessages();
            }
        };
        socket.on('receive_message', handleReceiveMessage);
        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, conversationId, refreshMessages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !socket) return;
        const messageData: NewMessageData = {
            content: newMessage,
            sender_id: user.id,
            conversation_id: conversationId,
        };
        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    const handleDeleteMessage = async (messageId: string | number) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete message');
            }
            refreshMessages();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteConversation = async () => {
        if (!token || !conversation) return;
        setIsDeletingConvo(true);
        try {
            await fetch(`/api/conversations/${conversation.id}/leave`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsDeletingConvo(false);
            setIsDeleteConvoModalOpen(false);
        }
    };

    const isLoading = isLoadingMessages || isLoadingConvo;
    const error = messagesError || convoError;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-background">
                <div className="p-4 border-b border-primary-border bg-surface"><SkeletonLoader className="h-10 w-1/3" /></div>
                <div className="flex-grow p-4 space-y-4">
                    <SkeletonLoader className="h-12 w-1/2" />
                    <SkeletonLoader className="h-16 w-2/3 ml-auto" />
                    <SkeletonLoader className="h-8 w-1/3" />
                </div>
                <div className="p-4 border-t border-primary-border bg-surface"><SkeletonLoader className="h-10 w-full" /></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500 text-center">{error}</div>;
    }

    if (!conversation) {
        return <div className="p-4 text-secondary-text text-center">Conversation not found.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <ChatHeader
                conversation={conversation}
                onOpenInfo={() => setIsInfoModalOpen(true)}
                onDeleteConversation={() => setIsDeleteConvoModalOpen(true)}
            />
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-1">
                    {(messages || []).map((msg: Message, index: number) => {
                        const isCurrentUser = msg.sender_id === user?.id;
                        const previousMsg = messages ? messages[index - 1] : null;
                        const isGroup = conversation.type === 'GROUP';
                        const showSenderInfo = isGroup && (
                            !previousMsg ||
                            previousMsg.sender_id !== msg.sender_id ||
                            !!previousMsg.deleted_at
                        );
                        const profilePic = msg.sender?.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${msg.sender?.username || '?'}`;
                        const canDelete = isCurrentUser || myRole === 'ADMIN';
                        return (
                            <div
                                key={msg.id}
                                className={`group flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                                onMouseEnter={() => setHoveredMessageId(msg.id)}
                                onMouseLeave={() => setHoveredMessageId(null)}
                            >
                                {showSenderInfo && !isCurrentUser && (
                                    <div className="flex items-center gap-2 mb-1 px-2">
                                        <img src={profilePic} alt={msg.sender?.username} className="w-6 h-6 rounded-full object-cover" />
                                        <Link to={`/${msg.sender?.username}`} className="text-sm font-semibold text-secondary-text hover:underline">
                                            {msg.sender?.username || 'Unknown'}
                                        </Link>
                                    </div>
                                )}
                                <div className={`flex items-center gap-2 w-full ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                    {isCurrentUser && hoveredMessageId === msg.id && canDelete && !msg.deleted_at && (
                                        <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded-full text-secondary-text hover:bg-red-500/10 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <div className={`p-3 rounded-lg max-w-lg ${msg.deleted_at
                                        ? 'bg-transparent border border-primary-border/30 text-secondary-text italic'
                                        : (isCurrentUser ? 'bg-accent text-white' : 'bg-surface text-primary-text')
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                    {!isCurrentUser && hoveredMessageId === msg.id && canDelete && !msg.deleted_at && (
                                        <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded-full text-secondary-text hover:bg-red-500/10 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-primary-border bg-surface">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-accent text-white font-semibold rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-90" // Added transition, scale
                    >
                        Send
                    </button>
                </form>
            </div>
            {isInfoModalOpen && conversation && conversation.type === 'GROUP' && (
                <GroupInfoModal
                    initialConversation={conversation}
                    onClose={() => setIsInfoModalOpen(false)}
                    onConversationUpdate={() => {
                        refreshConversation();
                    }}
                    onConversationDeleted={() => {
                        onClose();
                    }}
                />
            )}
            <ConfirmationModal
                isOpen={isDeleteConvoModalOpen}
                onClose={() => setIsDeleteConvoModalOpen(false)}
                onConfirm={handleDeleteConversation}
                title="Delete Chat"
                message="Are you sure you want to delete this chat? This will only remove it from your view."
                confirmText="Delete"
                confirmVariant="danger"
                isLoading={isDeletingConvo}
            />
        </div>
    );
}

export default ChatWindow;