import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { User, UserProfile, FollowData, UserProfileResponse } from '../types';
import { SkeletonLoader } from './SkeletonLoader.tsx';
import { useApi } from '../hooks/useApi.ts';

function RightPanel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [outgoingFollows, setOutgoingFollows] = useState(new Map<number, string>());
    const { user, token } = useAuth();
    const { username: profileUsername } = useParams<{ username: string }>();
    const navigate = useNavigate();
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

    const { data: outgoingFollowsData, refresh: fetchOutgoingFollows } = useApi<FollowData[]>(
        user ? `/api/users/${user.id}/following` : null
    );

    const { data: suggestedUsers, isLoading: isLoadingSuggested, error: suggestedError } = useApi<User[]>(
        token ? '/api/users' : null, // <-- We will fix this URL later
        { skip: !!profileUsername || searchQuery.trim() !== '' }
    );

    const { data: searchResults, isLoading: isLoadingSearch, error: searchError } = useApi<User[]>(
        token ? `/api/users/search?q=${searchQuery}` : null,
        { skip: searchQuery.trim() === '' }
    );

    const { data: selectedProfile, isLoading: isLoadingProfile, error: profileError } = useApi<UserProfileResponse>(
        token ? `/api/users/${profileUsername}` : null,
        { skip: !profileUsername }
    );

    const profileData = (selectedProfile as UserProfile); // Type assertion
    const { data: mutuals, isLoading: isLoadingMutuals, error: mutualsError } = useApi<User[]>(
        profileData ? `/api/users/${profileData.username}/mutuals-with-viewer` : null,
        { skip: !profileData }
    );

    useEffect(() => {
        if (outgoingFollowsData) {
            const followsMap = new Map(outgoingFollowsData.map((f: FollowData) => [f.following_id, f.status]));
            setOutgoingFollows(followsMap);
        }
    }, [outgoingFollowsData]);

    const handleFollowToggle = async (userIdToToggle: number, isPrivate?: boolean) => {
        if (!user || !token) return;
        try {
            const currentStatus = outgoingFollows.get(userIdToToggle);
            let newStatus: string | undefined;
            if (currentStatus === 'accepted' || currentStatus === 'pending') {
                newStatus = undefined;
            } else {
                newStatus = isPrivate === false ? 'accepted' : 'pending';
            }
            const newMap = new Map(outgoingFollows);
            if (newStatus) newMap.set(userIdToToggle, newStatus);
            else newMap.delete(userIdToToggle);
            setOutgoingFollows(newMap);
            await fetchApi(`/api/follows/user/${userIdToToggle}`, { method: 'POST' });
            fetchOutgoingFollows();
        } catch (error) {
            console.error("Error toggling follow:", error);
            fetchOutgoingFollows();
        }
    };

    const handleBlock = async () => {
        if (!profileData || !token || isBlocking) return;
        setIsBlocking(true);
        setBlockError(null);
        try {
            await fetchApi(`/api/block/user/${profileData.id}`, {
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
        if (isLoadingProfile) return <SkeletonLoader className="h-40 w-full" />;
        if (profileError) return <p className="p-4 text-red-500">{profileError}</p>;
        if (!profileData) return null;
        const profile = profileData;
        const isMyProfile = user?.id === profile.id;
        const profilePic = profile.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username}`;
        const followStatus = outgoingFollows.get(profile.id);
        const isPrivate = (profile as any).is_private === true || profile.settings?.is_private === true;
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
                            onClick={() => handleFollowToggle(profile.id, isPrivate)}
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
        if (isLoadingMutuals) return <SkeletonLoader className="h-20 w-full" />;
        if (mutualsError) return <p className="p-4 text-red-500">{mutualsError}</p>;
        if (!profileData || !mutuals || mutuals.length === 0) return null;
        return (
            <div className="p-4 mt-4 border-t border-primary-border">
                <h3 className="font-bold text-lg mb-2 text-primary-text">Mutual Connections</h3>
                <div className="space-y-1">
                    {mutuals.map(renderUserListItem)}
                </div>
            </div>
        );
    };

    const renderUserList = (title: string, data: User[] | null, isLoading: boolean, error: string | null) => (
        <div>
            <h2 className="font-bold text-lg mb-2 text-primary-text">{title}</h2>
            {isLoading && <SkeletonLoader className="h-24 w-full" />}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {!isLoading && !error && (
                <div className="space-y-1">
                    {data && data.length > 0 ? (
                        data.filter(u => u.id !== user?.id).map(renderUserListItem)
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
                    ? renderUserList('Search Results', searchResults, isLoadingSearch, searchError)
                    : renderUserList('People You May Know', suggestedUsers, isLoadingSuggested, suggestedError)
            )}
        </div>
    );
}

export default RightPanel;