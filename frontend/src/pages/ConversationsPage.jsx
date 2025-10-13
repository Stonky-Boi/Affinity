import { useState, useEffect } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mutuals, setMutuals] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // A simple way to trigger refresh
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isModalOpen && token) {
      fetch('http://localhost:3000/users/mutuals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setMutuals(data));
    }
  }, [isModalOpen, token]);

  const handleStartConversation = async (recipientId) => {
    const response = await fetch('http://localhost:3000/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
      body: JSON.stringify({ recipient_id: recipientId }),
    });
    const conversation = await response.json();
    setIsModalOpen(false); // Close modal
    setSelectedConversationId(conversation.id); // Select the new conversation
    setRefreshKey(prev => prev + 1); // Trigger a refresh of the conversation list
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-white relative">
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg">
            New Message
          </button>
        </div>
        <ConversationList key={refreshKey} onSelectConversation={setSelectedConversationId} />
      </div>

      <main className="w-2/3 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow conversationId={selectedConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}
      </main>

      {/* New Conversation Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Start a new message</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {mutuals.map(user => (
                <div key={user.id} onClick={() => handleStartConversation(user.id)} className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <img src={user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                  <p className="font-semibold ml-3">{user.username}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setIsModalOpen(false)} className="mt-4 w-full bg-gray-200 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ConversationsPage;