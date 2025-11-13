import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostList from '../components/PostList';
import UserCard from '../components/UserCard';
import { SkeletonLoader, PostSkeleton } from '../components/SkeletonLoader';
import type { FollowData, UserProfile, PublicProfilePageView, MutualUser } from '../types';
import { Lock } from 'lucide-react';

function PublicProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PublicProfilePageView>('posts');
  const [followers, setFollowers] = useState<FollowData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [mutuals, setMutuals] = useState<MutualUser[]>([]);
  const { username } = useParams();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("You must be logged in to view profiles.");
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/users/${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) throw new Error("This profile is not available.");
          if (res.status === 404) throw new Error(`User not found: @${username}`);
          throw new Error('Failed to fetch user profile.');
        }
        return res.json();
      })
      .then(data => {
        if (data.error) { throw new Error(data.error); }
        const profileData = data as UserProfile;
        setProfile(profileData);
        const authHeader = { 'Authorization': `Bearer ${token}` };
        return Promise.all([
          fetch(`/api/users/${profileData.id}/followers`, { headers: authHeader }),
          fetch(`/api/users/${profileData.id}/following`, { headers: authHeader }),
          fetch(`/api/users/${profileData.username}/mutuals-with-viewer`, { headers: authHeader })
        ]);
      })
      .then(async ([followersRes, followingRes, mutualsRes]) => {
        if (!followersRes.ok) throw new Error('Failed to fetch followers.');
        if (!followingRes.ok) throw new Error('Failed to fetch following list.');
        if (!mutualsRes.ok) throw new Error('Failed to fetch mutuals.');
        const followersData = await followersRes.json();
        const followingData = await followingRes.json();
        const mutualsData = await mutualsRes.json();
        setFollowers(followersData as FollowData[]);
        setFollowing(followingData as FollowData[]);
        setMutuals(mutualsData as MutualUser[]);
      })
      .catch(err => {
        console.error("Error loading profile page:", err);
        setError(err.message);
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [username, token]);

  if (loading) {
    return (
      <div>
        <div className="p-8 bg-surface border-b border-primary-border">
          <SkeletonLoader className="w-24 h-24 rounded-full mb-4" />
          <SkeletonLoader className="h-8 w-1/3 mb-2" />
          <SkeletonLoader className="h-4 w-1/4 mb-4" />
          <SkeletonLoader className="h-4 w-3/4" />
        </div>
        <div className="border-b border-primary-border flex bg-surface justify-around">
          <SkeletonLoader className="h-12 w-1/3 m-2" />
          <SkeletonLoader className="h-12 w-1/3 m-2" />
          <SkeletonLoader className="h-12 w-1/3 m-2" />
        </div>
        <div className="p-8 space-y-6"> <PostSkeleton /> <PostSkeleton /> </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="p-4 bg-red-500/10 text-red-500 border border-red-500 rounded-lg">{error}</p>
      </div>
    );
  }

  if (!profile) return <div className="p-8"><h2 className="text-primary-text">User not found: {username}</h2></div>;

  const isMyProfile = user && user.username === username;
  const isPrivate = (profile as any).is_private === true || profile.settings?.is_private === true;
  const profilePic = profile.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username}`;

  const tabButtonClasses = (tabName: PublicProfilePageView) =>
    `py-3 px-4 font-semibold flex flex-col items-center justify-center text-center w-1/3 transition-colors duration-200 ${view === tabName
      ? 'border-b-2 border-accent text-accent'
      : 'text-secondary-text hover:text-primary-text hover:bg-primary-border/50'
    }`;

  const postCount = profile.posts?.length || 0;
  const followerCount = followers.length;
  const followingCount = following.length;

  return (
    <div>
      <div className="p-8 bg-surface border-b border-primary-border">
        <img src={profilePic} alt={profile.username} className="w-24 h-24 rounded-full mb-4 object-cover" />
        <h1 className="text-3xl font-bold text-primary-text">{profile.first_name || profile.username}</h1>
        <p className="text-secondary-text">@{profile.username}</p>
        <p className="mt-4 text-primary-text">{profile.bio || "This user hasn't written a bio yet."}</p>
        <div className="mt-4 flex gap-2">
          {isMyProfile && (
            <Link to="/profile">
              <button className="px-4 py-2 bg-primary-border text-primary-text font-semibold rounded-lg hover:brightness-95">
                Edit Profile
              </button>
            </Link>
          )}
        </div>
      </div>
      {isPrivate && !isMyProfile ? (
        <div className="p-8 text-center">
          <Lock size={48} className="mx-auto text-secondary-text" />
          <h2 className="mt-4 text-xl font-bold">This Account is Private</h2>
          <p className="text-secondary-text">Follow this account to see their posts.</p>
        </div>
      ) : (
        <>
          <div className="border-b border-primary-border flex justify-around bg-surface">
            <button onClick={() => setView('posts')} className={tabButtonClasses('posts')}>
              <span className="font-bold text-lg">{postCount}</span>
              <span className="text-sm">Posts</span>
            </button>
            <button onClick={() => setView('mutuals')} className={tabButtonClasses('mutuals')}>
              <span className="font-bold text-lg">{mutuals.length}</span>
              <span className="text-sm">Friends</span>
            </button>
            <button onClick={() => setView('followers')} className={tabButtonClasses('followers')}>
              <span className="font-bold text-lg">{followerCount}</span>
              <span className="text-sm">Followers</span>
            </button>
            <button onClick={() => setView('following')} className={tabButtonClasses('following')}>
              <span className="font-bold text-lg">{followingCount}</span>
              <span className="text-sm">Following</span>
            </button>
          </div>
          <div className="p-8">
            {view === 'posts' && <PostList posts={profile.posts || []} />}
            {view === 'mutuals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mutuals.length > 0 ? mutuals.map(mUser => (
                  <div key={mUser.id} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-primary-border">
                    <UserCard user={mUser} />
                    <span className="font-bold text-lg text-accent pr-4">
                      {mUser.score}
                    </span>
                  </div>
                )) : (
                  <p className="text-secondary-text">No friends found.</p>
                )}
              </div>
            )}
            {view === 'followers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followers.map(f => <UserCard key={f.follower_id} user={f.follower!} />)}
              </div>
            )}
            {view === 'following' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {following.map(f => <UserCard key={f.following_id} user={f.following!} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PublicProfilePage;