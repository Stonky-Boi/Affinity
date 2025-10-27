import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function ConversationList({ onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3000/conversations', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    .then(res => res.json())
    .then(data => setConversations(data))
    .catch(error => console.error("Failed to fetch conversations:", error));
  }, [token]);

  // Helper to generate display name for a conversation
  const getConversationName = (convo) => {
    if (convo.name) {
      return convo.name; // Use group name if available
    }
    if (convo.participants.length === 2) {
      const recipient = convo.participants.find(p => p.id !== user?.id);
      return recipient?.username || "Unknown User"; // 1-on-1 chat
    }
    if (convo.participants.length > 2) {
      // List first few participants for unnamed group chats
      return convo.participants
        .filter(p => p.id !== user?.id)
        .map(p => p.username)
        .slice(0, 3) // Show max 3 names
        .join(', ') + (convo.participants.length > 4 ? '...' : '');
    }
    return "Empty Conversation"; // Fallback
  };

  const getLastMessagePreview = (convo) => {
     const lastMsg = convo.messages[0];
     if (!lastMsg) return "No messages yet";
     // Optional: Add sender name to preview for group chats
     const senderName = lastMsg.sender?.id === user?.id ? "You: " : (convo.participants.length > 2 ? `${lastMsg.sender?.username || '?'}: ` : "");
     return `${senderName}${lastMsg.content}`;
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {conversations.map(convo => {
          if (!convo || !convo.participants) return null; // Add safety check

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