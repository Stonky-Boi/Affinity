import { useState } from 'react';

function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  return (
    <div className="flex h-screen bg-white border-t">
      {/* Left Panel: Conversations List */}
      <div className="w-1/3 border-r">
        <div className="p-4">
          <h1 className="text-xl font-bold">Conversations</h1>
          {/* The list of conversations will go here */}
        </div>
      </div>

      {/* Right Panel: Chat Window */}
      <main className="w-2/3 flex flex-col">
        {selectedConversationId ? (
          <div className="p-4">
            <h1 className="text-xl font-bold">Chat Window for {selectedConversationId}</h1>
            {/* The actual chat messages and input form will go here */}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ConversationsPage;