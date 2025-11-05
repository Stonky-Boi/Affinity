import { useState, useEffect } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mutuals, setMutuals] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (isModalOpen && token) {
      fetch('/api/users/mutuals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then((data: User[]) => setMutuals(data));
    }
  }, [isModalOpen, token]);

  const handleStartConversation = async () => {
    if (selectedParticipants.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }
    const isGroupChat = selectedParticipants.length > 1;
    const participantIds = selectedParticipants.map(p => p.id);
    setIsStarting(true);
    setModalError(null);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          participant_ids: participantIds,
          name: isGroupChat ? groupName : null
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }
      const conversation = await response.json();
      setIsModalOpen(false);
      setSelectedParticipants([]);
      setGroupName('');
      setSelectedConversationId(conversation.id);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Error starting conversation:", error);
      setModalError(error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const toggleParticipant = (participant: User) => {
    setSelectedParticipants(prev =>
      prev.some(p => p.id === participant.id)
        ? prev.filter(p => p.id !== participant.id)
        : [...prev, participant]
    );
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-background relative">
      <div className="w-1/3 border-r border-primary-border overflow-y-auto">
        <div className="p-4 border-b border-primary-border">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-accent text-white font-semibold py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-90">
            New Message
          </button>
        </div>
        <ConversationList key={refreshKey} onSelectConversation={setSelectedConversationId} />
      </div>
      <main className="w-2/3 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow conversationId={String(selectedConversationId)} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-secondary-text">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
      {isModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-primary-text">Start a new message</h2>
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
                  <div
                    key={mutualUser.id}
                    onClick={() => toggleParticipant(mutualUser)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center ${isSelected ? 'bg-accent/20' : 'hover:bg-primary-border'}`}
                  >
                    <img src={mutualUser.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${mutualUser.username}`} alt={mutualUser.username} className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0" />
                    <span className={`font-semibold text-primary-text ${isSelected ? 'font-bold' : ''}`}>{mutualUser.username}</span>
                  </div>
                );
              })}
            </div>
            {modalError && (
              <p className="text-red-500 text-sm mt-2 text-center">{modalError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setIsModalOpen(false); /* ... */ }}
                className="flex-1 bg-primary-border text-primary-text font-semibold py-2 rounded-lg hover:brightness-95"
              >Cancel</button>
              <button
                onClick={handleStartConversation}
                disabled={selectedParticipants.length === 0 || isStarting}
                className="flex-1 bg-accent text-white font-semibold py-2 rounded-lg hover:brightness-90 disabled:opacity-50"
              >
                {isStarting ? 'Starting...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationsPage;