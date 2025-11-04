import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Conversation, ConversationListProps } from '../types';

function ConversationList({ onSelectConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;
    fetch('/api/conversations', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then((data: Conversation[]) => setConversations(data))
      .catch(error => console.error("Failed to fetch conversations:", error));
  }, [token]);

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

  return (
    <div className="p-4">
      <div className="space-y-2">
        {conversations.map(convo => {
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
        })}
      </div>
    </div>
  );
}

export default ConversationList;