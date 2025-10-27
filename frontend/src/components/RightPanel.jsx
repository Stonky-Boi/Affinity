import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RightPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
      console.log(data);
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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return; // Clear results if the search bar is empty
    }

    // This fetches search results from the new backend endpoint
    fetch(`http://localhost:3000/users/search?q=${searchQuery}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setSearchResults(data));

  }, [searchQuery, token]);

  const handleFollowToggle = (userIdToToggle) => {
    if (!user) return;
    fetch(`http://localhost:3000/users/${userIdToToggle}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
    })
    .then(fetchOutgoingFollows); // Refresh the follows list to update button state
  };

  const renderUserCard = (userToRender) => {
    if (!user || userToRender.id === user.id) return null;

    const followStatus = outgoingFollows.get(userToRender.id);
    let buttonText = 'Follow';
    let buttonClass = 'bg-blue-500 text-white hover:bg-blue-600';

    if (followStatus === 'accepted') {
      buttonText = 'Following';
      buttonClass = 'bg-gray-300 text-black';
    } else if (followStatus === 'pending') {
      buttonText = 'Requested';
      buttonClass = 'bg-gray-300 text-black';
    }

    const profilePic = userToRender.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${userToRender.username}`;

  return (
      <div key={userToRender.id} className="flex items-center p-2 bg-white rounded-lg shadow-sm">
        <img src={profilePic} alt={userToRender.username} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        <div className="ml-3 flex-grow">
          <Link to={`/${userToRender.username}`}>
            <p className="font-semibold hover:underline">{userToRender.username}</p>
          </Link>
          <button
            onClick={() => handleFollowToggle(userToRender.id)}
            className={`mt-1 w-full py-1 rounded-lg text-sm font-semibold ${buttonClass}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        {/* 3. ADD THE SEARCH INPUT FIELD */}
        <input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded-lg mb-4"
        />

        {/* 4. ADD CONDITIONAL RENDERING LOGIC */}
        {searchQuery.trim() !== '' ? (
          <div>
            <h2 className="font-bold text-xl mb-4">Search Results</h2>
            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map(renderUserCard)
              ) : (
                <p className="text-gray-500">No users found.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-bold text-xl mb-4">People You May Know</h2>
            <div className="space-y-4">
              {suggestedUsers.map(renderUserCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RightPanel;
