import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth

function RightPanel() {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const { user } = useAuth(); // 2. Get the logged-in user

  const fetchFollowing = () => {
    if (!user) return;
    fetch(`http://localhost:3000/users/${user.id}/following`)
      .then(response => response.json())
      .then(data => {
        const ids = new Set(data.map(follow => follow.following_id));
        setFollowingIds(ids);
      });
  };

  useEffect(() => {
    fetch('http://localhost:3000/users')
      .then(response => response.json())
      .then(data => setSuggestedUsers(data));
    
    fetchFollowing();
  }, [user]); // Re-fetch when the user logs in or out

  const handleFollowToggle = (userIdToToggle) => {
    if (!user) return;
    fetch(`http://localhost:3000/users/${userIdToToggle}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: user.id }), // 3. Use the real user's ID
    })
    .then(fetchFollowing);
  };

  return (
    <div className="p-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-bold text-lg mb-4">People You May Know</h2>
        <div className="space-y-4">
          {suggestedUsers.map(u => {
            if (!user || u.id === user.id) return null; // Don't show the current user

            const isFollowing = followingIds.has(u.id);
            return (
              <div key={u.id} className="flex items-center justify-between">
                <div><p className="font-semibold">{u.username}</p></div>
                <button
                  onClick={() => handleFollowToggle(u.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    isFollowing
                      ? 'bg-gray-300 text-black'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RightPanel;