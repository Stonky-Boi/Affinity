import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RightPanel() {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [outgoingFollows, setOutgoingFollows] = useState(new Map());
  const { user, token } = useAuth();

  const fetchOutgoingFollows = () => {
    if (!user) return;
    // The existing /following endpoint now returns pending requests too
    fetch(`http://localhost:3000/users/${user.id}/following`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      // Create a Map for quick lookups: { userId -> status }
      const followsMap = new Map(data.map(f => [f.following_id, f.status]));
      setOutgoingFollows(followsMap);
    });
  };

  useEffect(() => {
    fetch('http://localhost:3000/users')
      .then(res => res.json())
      .then(data => setSuggestedUsers(data));

    fetchOutgoingFollows();
  }, [user]);

  const handleFollowToggle = (userIdToToggle) => {
    if (!user) return;
    fetch(`http://localhost:3000/users/${userIdToToggle}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
    })
    .then(fetchOutgoingFollows); // Refresh the follows list to update button state
  };

  return (
    <div className="p-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-bold text-xl mb-4">People You May Know</h2>
        <div className="space-y-3">
          {suggestedUsers.map(u => {
            if (!user || u.id === user.id) return null;

            const followStatus = outgoingFollows.get(u.id);
            let buttonText = 'Follow';
            let buttonClass = 'bg-blue-500 text-white hover:bg-blue-600';

            if (followStatus === 'accepted') {
              buttonText = 'Following';
              buttonClass = 'bg-gray-300 text-black';
            } else if (followStatus === 'pending') {
              buttonText = 'Requested';
              buttonClass = 'bg-gray-300 text-black';
            }

            return (
              // This is the new card layout
              <div key={u.id} className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                
                {/* 1. New container for vertical stacking */}
                <div className="ml-3 flex-grow">
                  <Link to={`/${u.username}`}>
                    <p className="font-semibold hover:underline">{u.username}</p>
                  </Link>
                  
                  {/* 2. Button is now below the username */}
                  <button
                    onClick={() => handleFollowToggle(u.id)}
                    className={`mt-1 w-full py-1 rounded-lg text-sm font-semibold ${buttonClass}`}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RightPanel;