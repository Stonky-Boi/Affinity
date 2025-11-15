import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Message, NewMessageData, ChatWindowProps } from '../types';
import { SkeletonLoader } from './SkeletonLoader';

function ChatWindow({ conversationId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, token, socket } = useAuth();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // 1. Fetch initial messages
    useEffect(() => {
        if (!conversationId || !token) return;
        setMessages([]);
        setIsLoading(true);
        setError(null);
        fetch(`/api/conversations/${conversationId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load messages.');
                return res.json();
            })
            .then((data: Message[]) => setMessages(data))
            .catch(err => {
                console.error(err);
                setError(err.message);
            })
            .finally(() => setIsLoading(false));
    }, [conversationId, token]);

    // 2. Set up socket listeners
    useEffect(() => {
        if (!socket || !conversationId) return;
        socket.emit('join_conversation', conversationId);
        // Listener for new messages
        const handleReceiveMessage = (incomingMessage: Message) => {
            if (String(incomingMessage.conversation_id) === String(conversationId)) {
                setMessages(prevMessages => [...prevMessages, incomingMessage]);
            }
        };
        // Register the listener
        socket.on('receive_message', handleReceiveMessage);
        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, conversationId]);

    // 3. Send a message
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !socket) return;
        const messageData: NewMessageData = {
            content: newMessage,
            sender_id: user.id,
            conversation_id: conversationId,
        };
        // Use the global socket to send
        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-grow p-4 overflow-y-auto">
                {isLoading && (
                    <div className="space-y-4">
                        <SkeletonLoader className="h-12 w-1/2" />
                        <SkeletonLoader className="h-16 w-2/3 ml-auto" />
                        <SkeletonLoader className="h-8 w-1/3" />
                    </div>
                )}
                {error && (
                    <p className="text-red-500 text-center">{error}</p>
                )}
                {!isLoading && !error && (
                    <div className="space-y-1">
                        {messages.map((msg: Message, index: number) => {
                            const isCurrentUser = msg.sender_id === user?.id;
                            const previousMsg = messages[index - 1];
                            const showSenderInfo = !previousMsg || previousMsg.sender_id !== msg.sender_id;
                            const profilePic = msg.sender?.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${msg.sender?.username || '?'}`;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    {showSenderInfo && !isCurrentUser && (
                                        <div className="flex items-center gap-2 mb-1 px-2">
                                            <img src={profilePic} alt={msg.sender?.username} className="w-6 h-6 rounded-full object-cover" />
                                            <Link to={`/${msg.sender?.username}`} className="text-sm font-semibold text-secondary-text hover:underline">
                                                {msg.sender?.username || 'Unknown'}
                                            </Link>
                                        </div>
                                    )}
                                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full`}>
                                        <div className={`p-3 rounded-lg max-w-lg ${isCurrentUser
                                            ? 'bg-accent text-white'
                                            : 'bg-surface text-primary-text'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
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
        </div>
    );
}

export default ChatWindow;