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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    })
      .then(fetchOutgoingFollows); // Refresh the follows list to update button state
  };

  const renderUserCard = (userToRender) => {
    if (!user || userToRender.id === user.id) return null;

    const followStatus = outgoingFollows.get(userToRender.id);
    let buttonText = 'Follow';
    // Use semantic colors for button states
    let buttonClass = 'bg-accent text-white'; // Default: Follow button

    if (followStatus === 'accepted') {
      buttonText = 'Following';
      buttonClass = 'bg-primary-border text-primary-text'; // Grayed out for Following/Requested
    } else if (followStatus === 'pending') {
      buttonText = 'Requested';
      buttonClass = 'bg-primary-border text-primary-text';
    }

    const profilePic = userToRender.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${userToRender.username}`;

    return (
      // Use semantic background for the card
      <div key={userToRender.id} className="flex items-center p-2 bg-surface rounded-lg shadow-sm">
        <img src={profilePic} alt={userToRender.username} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        <div className="ml-3 flex-grow">
          <Link to={`/${userToRender.username}`}>
            {/* Use semantic text color */}
            <p className="font-semibold hover:underline text-primary-text">{userToRender.username}</p>
          </Link>
          <button
            onClick={() => handleFollowToggle(userToRender.id)}
            // Apply updated button classes
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
      {/* Container background set in MainLayout (bg-surface) */}
      <div className="p-4 rounded-lg">
        {/* Search Input - use semantic colors */}
        <input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-primary-border rounded-lg mb-4 bg-background text-primary-text placeholder-secondary-text"
        />

        {/* Conditional Rendering */}
        {searchQuery.trim() !== '' ? (
          <div>
            <h2 className="font-bold text-xl mb-4 text-primary-text">Search Results</h2>
            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map(renderUserCard)
              ) : (
                // Use semantic text color
                <p className="text-secondary-text">No users found.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-bold text-xl mb-4 text-primary-text">People You May Know</h2>
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