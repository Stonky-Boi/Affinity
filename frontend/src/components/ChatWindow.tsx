import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import type { Message, NewMessageData, ChatWindowProps, AppSocket } from '../types';

function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user, token } = useAuth();

  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    if (!conversationId || !token) return;
    fetch(`http://localhost:3000/conversations/${conversationId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then((data: Message[]) => setMessages(data));
  }, [conversationId, token]);

  useEffect(() => {
    if (!conversationId) return;

    const socket: AppSocket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.emit('join_conversation', conversationId);

    socket.on('receive_message', (incomingMessage: Message) => {
      setMessages(prevMessages => [...prevMessages, incomingMessage]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    const messageData: NewMessageData = {
      content: newMessage,
      sender_id: user.id,
      conversation_id: conversationId,
    };

    socketRef.current?.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-1">
          {messages.map((msg, index) => {
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
    </div>
  );
}

export default ChatWindow;