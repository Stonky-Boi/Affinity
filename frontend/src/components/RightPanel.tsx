import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { User, UserProfile, FollowData, UserProfileResponse } from '../types';

function RightPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [outgoingFollows, setOutgoingFollows] = useState(new Map<number, string>());
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [mutualConnections, setMutualConnections] = useState<User[]>([]);
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchUserParam = searchParams.get('searchUser');

  const fetchOutgoingFollows = () => {
    if (!user || !token) return;
    fetch(`http://localhost:3000/users/${user.id}/following`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: FollowData[]) => {
        const followsMap = new Map(data.map((f: FollowData) => [f.following_id, f.status]));
        setOutgoingFollows(followsMap);
      })
      .catch(error => console.error("Error fetching outgoing follows:", error));
  };

  useEffect(() => {
    if (!searchUserParam && token) {
      fetch('http://localhost:3000/users', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then((data: User[]) => setSuggestedUsers(data))
        .catch(error => console.error("Error fetching suggested users:", error));
    }
    fetchOutgoingFollows();
  }, [user, searchUserParam, token]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    if (!token) return;
    fetch(`http://localhost:3000/users/search?q=${searchQuery}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: User[]) => setSearchResults(data))
      .catch(error => console.error("Error fetching search results:", error));
  }, [searchQuery, token]);

  useEffect(() => {
    if (searchUserParam) {
      fetch(`http://localhost:3000/users/${searchUserParam}`)
        .then(res => res.json())
        .then((data: UserProfileResponse) => {
          if ('error' in data) {
            setSelectedUserProfile(null);
          } else {
            setSelectedUserProfile(data);
          }
        })
        .catch(error => { console.error("Error fetching selected user profile:", error); setSelectedUserProfile(null); });
    } else {
      setSelectedUserProfile(null);
    }
  }, [searchUserParam]);

  useEffect(() => {
    if (selectedUserProfile && token) {
      fetch(`http://localhost:3000/users/${selectedUserProfile.username}/mutuals-with-viewer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then((data: User[]) => setMutualConnections(data))
        .catch(error => console.error("Error fetching mutual connections:", error));
    } else {
      setMutualConnections([]);
    }
  }, [selectedUserProfile, token]);

  const handleFollowToggle = (userIdToToggle: number) => {
    if (!user || !token) return;
    fetch(`http://localhost:3000/users/${userIdToToggle}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ follower_id: user.id })
    })
      .then(() => {
        fetchOutgoingFollows();
        if (searchUserParam) {
          fetch(`http://localhost:3000/users/${searchUserParam}`)
            .then(res => res.json())
            .then((data: UserProfileResponse) => {
              if ('error' in data) {
                setSelectedUserProfile(null);
              } else {
                setSelectedUserProfile(data);
              }
            });
        }
      })
      .catch(error => console.error("Error toggling follow:", error));
  };

  const renderUserListItem = (userToRender: User) => {
    if (!userToRender || !user || userToRender.id === user.id) return null;
    const profilePic = userToRender.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${userToRender.username}`;
    return (
      <Link key={userToRender.id} to={`/?searchUser=${userToRender.username}`} className="flex items-center p-2 rounded-lg hover:bg-primary-border">
        <img src={profilePic} alt={userToRender.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <p className="font-semibold ml-3 text-primary-text">{userToRender.username}</p>
      </Link>
    );
  };

  const renderMutualConnections = () => {
    if (!selectedUserProfile || mutualConnections.length === 0) return null;
    return (
      <div className="p-4 mt-4 border-t border-primary-border">
        <h3 className="font-bold text-lg mb-2 text-primary-text">Mutual Connections</h3>
        <div className="space-y-1">
          {mutualConnections.map(renderUserListItem)}
        </div>
      </div>
    );
  };

  const renderSelectedUserProfile = () => {
    if (!selectedUserProfile) return null;
    const profilePic = selectedUserProfile.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${selectedUserProfile.username}`;
    const followStatus = outgoingFollows.get(selectedUserProfile.id);
    let buttonText = 'Follow';
    let buttonClass = 'bg-accent text-white';
    if (followStatus === 'accepted') { buttonText = 'Following'; buttonClass = 'bg-primary-border text-primary-text'; }
    if (followStatus === 'pending') { buttonText = 'Requested'; buttonClass = 'bg-primary-border text-primary-text'; }

    return (
      <div className="p-4 border-b border-primary-border">
        <img src={profilePic} alt={selectedUserProfile.username} className="w-16 h-16 rounded-full mb-2 object-cover mx-auto" />
        <Link to={`/${selectedUserProfile.username}`}><p className="font-semibold text-center text-primary-text hover:underline">{selectedUserProfile.username}</p></Link>
        <p className="text-sm text-secondary-text text-center mt-1">{selectedUserProfile.bio || ""}</p>
        <button
          onClick={() => handleFollowToggle(selectedUserProfile.id)}
          className={`mt-1 w-full py-1 rounded-lg text-sm font-semibold ${buttonClass} transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-95`}
        >
          {buttonText}
        </button>
        <button
          onClick={() => setSearchParams({})}
          className="mt-2 w-full text-center text-xs text-secondary-text hover:underline"
        >
          Clear Selection
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 bg-surface h-full overflow-y-auto">
      <input
        type="text"
        placeholder="Search for users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 border border-primary-border rounded-lg mb-4 bg-background text-primary-text placeholder-secondary-text"
      />

      {selectedUserProfile && renderSelectedUserProfile()}
      {selectedUserProfile && renderMutualConnections()}

      {!selectedUserProfile && (
        searchQuery.trim() !== '' ? (
          <div>
            <h2 className="font-bold text-lg mb-2 text-primary-text">Search Results</h2>
            <div className="space-y-1">
              {searchResults.length > 0 ? searchResults.map(renderUserListItem) : <p className="text-secondary-text text-sm">No users found.</p>}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-bold text-lg mb-2 text-primary-text">People You May Know</h2>
            <div className="space-y-1">
              {suggestedUsers.filter(u => u.id !== user?.id).map(renderUserListItem)}
            </div>
          </div>
        )
      )}
    </div>
  );
}
export default RightPanel;