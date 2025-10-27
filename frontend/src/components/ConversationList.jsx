import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// The 'onSelect' function will tell the parent page which chat to open
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

  const getRecipient = (participants) => {
    return participants.find(p => p.id !== user.id);
  };

  return (
    <div className="p-4">
      {/* Use semantic text color */}
      <h1 className="text-xl font-bold mb-4 text-primary-text">Conversations</h1>
      <div className="space-y-2">
        {conversations.map(convo => {
          const recipient = getRecipient(convo.participants);
          if (!recipient) return null;

          return (
            // Use semantic hover background
            <div
              key={convo.id}
              onClick={() => onSelectConversation(convo.id)}
              className="p-2 rounded-lg hover:bg-primary-border cursor-pointer" // Changed hover class
            >
              {/* Use semantic text colors */}
              <p className="font-semibold text-primary-text">{recipient.username}</p>
              <p className="text-sm text-secondary-text truncate">
                {convo.messages[0]?.content || "No messages yet"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConversationList;