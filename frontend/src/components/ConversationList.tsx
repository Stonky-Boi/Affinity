import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Conversation, ConversationListProps } from '../types';
import { SkeletonLoader } from './SkeletonLoader';

function ConversationList({ onSelectConversation, refreshKey }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, token } = useAuth();

    useEffect(() => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        fetch('/api/conversations', {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch conversations.');
                return res.json();
            })
            .then((data: Conversation[]) => setConversations(data))
            .catch(error => {
                console.error("Failed to fetch conversations:", error);
                setError(error.message);
            })
            .finally(() => setIsLoading(false));
    }, [token, refreshKey]);

    const getConversationName = (convo: Conversation) => {
        if (convo.name) {
            return convo.name;
        }
        if (convo.participants.length === 2) {
            const recipient = convo.participants.find(p => p.id !== user?.id);
            return recipient?.username || "Unknown User";
        }
        if (convo.participants.length > 2) {
            return convo.participants
                .filter(p => p.id !== user?.id)
                .map(p => p.username)
                .slice(0, 3)
                .join(', ') + (convo.participants.length > 4 ? '...' : '');
        }
        return "Empty Conversation";
    };

    const getLastMessagePreview = (convo: Conversation) => {
        const lastMsg = convo.messages[0];
        if (!lastMsg) return "No messages yet";
        const senderName = lastMsg.sender?.id === user?.id ? "You: " : (convo.participants.length > 2 ? `${lastMsg.sender?.username || '?'}: ` : "");
        return `${senderName}${lastMsg.content}`;
    }

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <SkeletonLoader className="h-12 w-full" />
                <SkeletonLoader className="h-12 w-full" />
            </div>
        );
    }

    if (error) {
        return <p className="p-4 text-red-500">{error}</p>;
    }

    return (
        <div className="p-4">
            <div className="space-y-2">
                {conversations.length === 0 ? (
                    <p className="text-secondary-text text-center">No conversations yet.</p>
                ) : (conversations.map(convo => {
                    if (!convo || !convo.participants) return null;
                    const displayName = getConversationName(convo);
                    const lastMessage = getLastMessagePreview(convo);
                    return (
                        <div
                            key={convo.id}
                            onClick={() => onSelectConversation(convo.id)}
                            className="p-2 rounded-lg hover:bg-primary-border cursor-pointer"
                        >
                            <p className="font-semibold text-primary-text truncate">{displayName}</p>
                            <p className="text-sm text-secondary-text truncate">{lastMessage}</p>
                        </div>
                    );
                }))}
            </div>
        </div>
    );
}

export default ConversationList;