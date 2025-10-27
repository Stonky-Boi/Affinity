import { useState, useEffect } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserCard from '../components/UserCard';

function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mutuals, setMutuals] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // A simple way to trigger refresh
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (isModalOpen && token) {
      fetch('http://localhost:3000/users/mutuals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setMutuals(data));
    }
  }, [isModalOpen, token]);

  // --- Updated handler to allow multiple participants ---
  const handleStartConversation = async () => {
    // Ensure at least one participant is selected
    if (selectedParticipants.length === 0) {
        alert("Please select at least one recipient."); // Add user feedback
        return;
    }
    const isGroupChat = selectedParticipants.length > 1;
    const participantIds = selectedParticipants.map(p => p.id);

    try {
        const response = await fetch('http://localhost:3000/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        // Send participantIds array and name ONLY if it's a group chat
        body: JSON.stringify({
            participant_ids: participantIds,
            name: isGroupChat ? groupName : null
        }),
        });

        if (!response.ok) { // Check for API errors
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to start conversation');
        }

        const conversation = await response.json();

        // Reset modal state
        setIsModalOpen(false);
        setSelectedParticipants([]);
        setGroupName('');

        setSelectedConversationId(conversation.id);
        setRefreshKey(prev => prev + 1);
    } catch (error) {
        console.error("Error starting conversation:", error);
        alert(`Error: ${error.message}`); // Show error to user
    }
  };

  const toggleParticipant = (participant) => {
     setSelectedParticipants(prev => 
        prev.some(p => p.id === participant.id)
         ? prev.filter(p => p.id !== participant.id) // Remove if already selected
         : [...prev, participant] // Add if not selected
     );
  };

  return (
    // Use semantic background
    <div className="flex h-[calc(100vh-65px)] bg-background relative">
      {/* Use semantic border */}
      <div className="w-1/3 border-r border-primary-border overflow-y-auto">
        {/* Use semantic border */}
        <div className="p-4 border-b border-primary-border">
          {/* Use semantic classes for button */}
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-accent text-white font-semibold py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-90">
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
            {/* Use semantic text color */}
            <p className="text-secondary-text">Select a conversation to start chatting</p>
          </div>
        )}
      </main>

      {/* --- Updated New Conversation Modal --- */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-primary-text">Start a new message</h2>

            {/* Optional Group Name Input */}
            {selectedParticipants.length > 1 && (
                 <input 
                    type="text"
                    placeholder="Group Name (optional)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full p-2 border border-primary-border rounded-lg mb-4 bg-background text-primary-text placeholder-secondary-text"
                 />
            )}

            <p className="text-sm text-secondary-text mb-2">Select recipients (mutual followers):</p>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-primary-border rounded-lg p-2 mb-4">
              {mutuals.map(mutualUser => {
                if (!mutualUser) return null;
                const isSelected = selectedParticipants.some(p => p.id === mutualUser.id);
                return (
                  // Use UserCard for display, toggle selection onClick
                  <div 
                     key={mutualUser.id} 
                     onClick={() => toggleParticipant(mutualUser)} 
                     // Apply visual feedback for selection
                     className={`p-2 rounded-lg cursor-pointer flex items-center ${isSelected ? 'bg-accent/20' : 'hover:bg-primary-border'}`}
                  >
                     <img src={mutualUser.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${mutualUser.username}`} alt={mutualUser.username} className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0" />
                     <span className={`font-semibold text-primary-text ${isSelected ? 'font-bold' : ''}`}>{mutualUser.username}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
                <button 
                    onClick={() => { setIsModalOpen(false); setSelectedParticipants([]); setGroupName(''); }} 
                    className="flex-1 bg-primary-border text-primary-text font-semibold py-2 rounded-lg hover:brightness-95"
                >Cancel</button>
                <button 
                    onClick={handleStartConversation} 
                    disabled={selectedParticipants.length === 0} // Disable if no one selected
                    className="flex-1 bg-accent text-white font-semibold py-2 rounded-lg hover:brightness-90 disabled:opacity-50"
                >Start Chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ConversationsPage;