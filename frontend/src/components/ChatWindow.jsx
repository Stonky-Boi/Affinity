import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client'; // 1. Import the socket.io client

function ChatWindow({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user, token } = useAuth();
  const socketRef = useRef(null); // Use a ref to hold the socket instance

  // Effect for fetching historical messages
  useEffect(() => {
    if (!conversationId || !token) return;
    fetch(`http://localhost:3000/conversations/${conversationId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setMessages(data));
  }, [conversationId, token]);

  // Effect for managing the real-time socket connection
  useEffect(() => {
    if (!conversationId) return;

    // 2. Connect to the backend socket server
    socketRef.current = io('http://localhost:3000');
    const socket = socketRef.current;

    // 3. Join the specific conversation "room"
    socket.emit('join_conversation', conversationId);

    // 4. Listen for incoming messages from the server
    socket.on('receive_message', (incomingMessage) => {
      setMessages(prevMessages => [...prevMessages, incomingMessage]);
    });

    // 5. Cleanup: Disconnect when the component unmounts or conversation changes
    return () => {
      socket.disconnect();
    };
  }, [conversationId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    const messageData = {
      content: newMessage,
      sender_id: user.id,
      conversation_id: conversationId,
    };

    // 6. Send the new message to the server
    socketRef.current.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    // Apply base background
    <div className="flex flex-col h-full bg-background">
      {/* Message Display Area */}
      <div className="flex-grow p-4 overflow-y-auto">
        {/* Reduced spacing between consecutive messages */}
        <div className="space-y-1">
          {messages.map((msg, index) => {
            // Check if sender is the current logged-in user
            const isCurrentUser = msg.sender_id === user.id;

            // Determine if the sender is different from the previous message
            const previousMsg = messages[index - 1];
            const showSenderInfo = !previousMsg || previousMsg.sender_id !== msg.sender_id;

            // Get profile picture URL or generate placeholder
            const profilePic = msg.sender?.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${msg.sender?.username || '?'}`;

            return (
              // Group message bubble and optional sender info
              <div key={msg.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>

                {/* Conditionally render sender info (Pic + Name) */}
                {showSenderInfo && !isCurrentUser && ( // Show only for OTHERS' messages
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <img src={profilePic} alt={msg.sender?.username} className="w-6 h-6 rounded-full object-cover" />
                    <Link to={`/${msg.sender?.username}`} className="text-sm font-semibold text-secondary-text hover:underline">
                      {msg.sender?.username || 'Unknown'}
                    </Link>
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className={`p-3 rounded-lg max-w-lg ${isCurrentUser
                      ? 'bg-accent text-white' // Sender's bubble
                      : 'bg-surface text-primary-text' // Recipient's bubble
                    }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Input Form */}
      {/* Apply semantic border and background */}
      <div className="p-4 border-t border-primary-border bg-surface">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          {/* Apply semantic classes to input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text"
          />
          {/* Apply semantic classes to button */}
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