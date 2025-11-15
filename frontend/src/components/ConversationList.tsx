import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Conversation, ConversationListProps } from '../types';
import { SkeletonLoader } from './SkeletonLoader';
import { Users } from 'lucide-react';

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

    const getOtherParticipant = (convo: Conversation) => {
        return convo.participants.find(p => p.user_id !== user?.id)?.user;
    };

    const getConversationName = (convo: Conversation) => {
        if (convo.type === 'GROUP') {
            return convo.name || 'Group Chat';
        }
        // For "DIRECT"
        const otherUser = getOtherParticipant(convo);
        return otherUser?.username || "Unknown User";
    };

    const getConversationPfp = (convo: Conversation) => {
        if (convo.type === 'GROUP') {
            return convo.picture_url;
        }
        // For "DIRECT"
        const otherUser = getOtherParticipant(convo);
        return otherUser?.picture_url;
    };

    const getLastMessagePreview = (convo: Conversation) => {
        const lastMsg = convo.messages[0];
        if (!lastMsg) return "No messages yet";
        if (lastMsg.deleted_at) return "This message was deleted";
        const senderName = lastMsg.sender?.id === user?.id ? "You: " : (convo.type === 'GROUP' ? `${lastMsg.sender?.username || '?'}: ` : "");
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
          const pfpUrl = getConversationPfp(convo);
          const defaultPfp = `https://api.dicebear.com/8.x/initials/svg?seed=${displayName}`;
          return (
            <div
              key={convo.id}
              onClick={() => onSelectConversation(convo.id)}
              className="p-2 rounded-lg hover:bg-primary-border cursor-pointer flex items-center gap-3"
            >
              {pfpUrl ? (
                <img src={pfpUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (convo.type === 'GROUP' ? (
                  <div className="w-10 h-10 rounded-full bg-primary-border flex-shrink-0 flex items-center justify-center">
                    <Users size={20} className="text-secondary-text" />
                  </div>
                ) : (
                  <img src={defaultPfp} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                )
              )}              
              <div className="overflow-hidden">
                <p className="font-semibold text-primary-text truncate">{displayName}</p>
                <p className="text-sm text-secondary-text truncate">{lastMessage}</p>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}

export default ConversationList;