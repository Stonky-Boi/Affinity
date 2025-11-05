import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { User, UserProfile, FollowData, UserProfileResponse } from '../types';
import { SkeletonLoader } from './SkeletonLoader.tsx';

function RightPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [outgoingFollows, setOutgoingFollows] = useState(new Map<number, string>());
  const { user, token } = useAuth();
  const { username: profileUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [searchResults, setSearchResults] = useState<{ loading: boolean, error: string | null, data: User[] }>({ loading: false, error: null, data: [] });
  const [suggestedUsers, setSuggestedUsers] = useState<{ loading: boolean, error: string | null, data: User[] }>({ loading: true, error: null, data: [] });
  const [selectedProfile, setSelectedProfile] = useState<{ loading: boolean, error: string | null, data: UserProfile | null }>({ loading: false, error: null, data: null });
  const [mutuals, setMutuals] = useState<{ loading: boolean, error: string | null, data: User[] }>({ loading: false, error: null, data: [] });
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const fetchApi = async (url: string, options: RequestInit = {}) => {
    const defaultHeaders: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const config: RequestInit = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    };
    const res = await fetch(url, config);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'API request failed');
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
  };

  const fetchOutgoingFollows = () => {
    if (!user || !token) return;
    fetchApi(`/api/users/${user.id}/following`)
      .then((data: FollowData[]) => {
        const followsMap = new Map(data.map((f: FollowData) => [f.following_id, f.status]));
        setOutgoingFollows(followsMap);
      })
      .catch(error => console.error("Error fetching outgoing follows:", error));
  };

  // Fetch suggested users (on mount)
  useEffect(() => {
    if (!token) return;
    setSuggestedUsers({ loading: true, error: null, data: [] });
    fetchApi('/api/users') // <-- TODO: This should be a real suggestion endpoint
      .then((data: User[]) => setSuggestedUsers({ loading: false, error: null, data }))
      .catch(error => setSuggestedUsers({ loading: false, error: error.message, data: [] }));
    fetchOutgoingFollows();
  }, [token]);

  // Fetch search results (on query change)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({ loading: false, error: null, data: [] });
      return;
    }
    if (!token) return;
    setSearchResults(prev => ({ ...prev, loading: true }));
    const handler = setTimeout(() => { // Debounce search
      fetchApi(`/api/users/search?q=${searchQuery}`)
        .then((data: User[]) => setSearchResults({ loading: false, error: null, data }))
        .catch(error => setSearchResults({ loading: false, error: error.message, data: [] }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, token]);

  // Fetch selected user profile (on param change)
  useEffect(() => {
    if (profileUsername) {
      setSelectedProfile({ loading: true, error: null, data: null });
      fetchApi(`/api/users/${profileUsername}`)
        .then((data: UserProfileResponse) => {
          if ('error' in data) throw new Error(data.error);
          setSelectedProfile({ loading: false, error: null, data });
        })
        .catch(error => setSelectedProfile({ loading: false, error: error.message, data: null }));
    } else {
      setSelectedProfile({ loading: false, error: null, data: null });
    }
  }, [profileUsername]);

  // Fetch mutuals (when selected profile changes)
  useEffect(() => {
    if (selectedProfile.data && token) {
      setMutuals({ loading: true, error: null, data: [] });
      fetchApi(`/api/users/${selectedProfile.data.username}/mutuals-with-viewer`)
        .then((data: User[]) => setMutuals({ loading: false, error: null, data }))
        .catch(error => setMutuals({ loading: false, error: error.message, data: [] }));
    } else {
      setMutuals({ loading: false, error: null, data: [] });
    }
  }, [selectedProfile.data, token]);

  // Follow/Unfollow action
  const handleFollowToggle = async (userIdToToggle: number) => {
    if (!user || !token) return;
    try {
      // Optimistic UI: Update status immediately
      const currentStatus = outgoingFollows.get(userIdToToggle);
      const newStatus = currentStatus === 'accepted' ? undefined : (currentStatus === 'pending' ? undefined : 'pending');
      const newMap = new Map(outgoingFollows);
      if (newStatus) newMap.set(userIdToToggle, newStatus);
      else newMap.delete(userIdToToggle);
      setOutgoingFollows(newMap);
      await fetchApi(`/api/follows/user/${userIdToToggle}`, { method: 'POST' });
    } catch (error) {
      console.error("Error toggling follow:", error);
      fetchOutgoingFollows();
    }
  };

  const handleBlock = async () => {
    if (!selectedProfile.data || !token || isBlocking) return;
    setIsBlocking(true);
    setBlockError(null);
    try {
      await fetchApi(`/api/block/user/${selectedProfile.data.id}`, {
        method: 'POST'
      });
      alert("Block status updated.");
      navigate('/');
    } catch (err: any) {
      setBlockError(err.message);
    } finally {
      setIsBlocking(false);
    }
  };

  const renderUserListItem = (userToRender: User) => {
    if (!userToRender || !user || userToRender.id === user.id) return null;
    const profilePic = userToRender.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${userToRender.username}`;
    return (
      <Link key={userToRender.id} to={`/${userToRender.username}`} className="flex items-center p-2 rounded-lg hover:bg-primary-border">
        <img src={profilePic} alt={userToRender.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <p className="font-semibold ml-3 text-primary-text">{userToRender.username}</p>
      </Link>
    );
  };

  const renderSelectedUserProfile = () => {
    if (selectedProfile.loading) return <SkeletonLoader className="h-40 w-full" />;
    if (selectedProfile.error) return <p className="p-4 text-red-500">{selectedProfile.error}</p>;
    if (!selectedProfile.data) return null;
    const profile = selectedProfile.data;
    const isMyProfile = user?.id === profile.id;
    const profilePic = profile.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username}`;
    const followStatus = outgoingFollows.get(profile.id);
    let buttonText = 'Follow';
    let buttonClass = 'bg-accent text-white';
    if (followStatus === 'accepted') { buttonText = 'Following'; buttonClass = 'bg-primary-border text-primary-text'; }
    if (followStatus === 'pending') { buttonText = 'Requested'; buttonClass = 'bg-primary-border text-primary-text'; }
    return (
      <div className="p-4 border-b border-primary-border">
        <img src={profilePic} alt={profile.username} className="w-16 h-16 rounded-full mb-2 object-cover mx-auto" />
        <Link to={`/${profile.username}`}><p className="font-semibold text-center text-primary-text hover:underline">{profile.username}</p></Link>
        <p className="text-sm text-secondary-text text-center mt-1 truncate">{profile.bio || ""}</p>
        {!isMyProfile && (
          <>
            <button
              onClick={() => handleFollowToggle(profile.id)}
              className={`mt-1 w-full py-1 rounded-lg text-sm font-semibold ${buttonClass} ...`}
            >
              {buttonText}
            </button>
            <button
              onClick={handleBlock}
              disabled={isBlocking}
              className="mt-1 w-full py-1 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isBlocking ? '...' : 'Block User'}
            </button>
            {blockError && (
              <p className="text-red-500 text-xs mt-1">{blockError}</p>
            )}
          </>
        )}
        <button
          onClick={() => navigate('/')}
          className="mt-2 w-full text-center text-xs text-secondary-text hover:underline"
        >
          Clear Selection
        </button>
      </div>
    );
  };

  const renderMutualConnections = () => {
    if (mutuals.loading) return <SkeletonLoader className="h-20 w-full" />;
    if (mutuals.error) return <p className="p-4 text-red-500">{mutuals.error}</p>;
    if (!selectedProfile.data || mutuals.data.length === 0) return null;
    return (
      <div className="p-4 mt-4 border-t border-primary-border">
        <h3 className="font-bold text-lg mb-2 text-primary-text">Mutual Connections</h3>
        <div className="space-y-1">
          {mutuals.data.map(renderUserListItem)}
        </div>
      </div>
    );
  };

  const renderUserList = (title: string, state: { loading: boolean, error: string | null, data: User[] }) => (
    <div>
      <h2 className="font-bold text-lg mb-2 text-primary-text">{title}</h2>
      {state.loading && <SkeletonLoader className="h-24 w-full" />}
      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {!state.loading && !state.error && (
        <div className="space-y-1">
          {state.data.length > 0 ? (
            state.data.filter(u => u.id !== user?.id).map(renderUserListItem)
          ) : (
            <p className="text-secondary-text text-sm">{title === 'Search Results' ? 'No users found.' : 'No suggestions found.'}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 bg-surface h-full overflow-y-auto">
      <input
        type="text"
        placeholder="Search for users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 border border-primary-border rounded-lg mb-4 bg-background text-primary-text placeholder-secondary-text"
      />
      {profileUsername ? (
        <>
          {renderSelectedUserProfile()}
          {renderMutualConnections()}
        </>
      ) : (
        searchQuery.trim() !== ''
          ? renderUserList('Search Results', searchResults)
          : renderUserList('People You May Know', suggestedUsers)
      )}
    </div>
  );
}

export default RightPanel;