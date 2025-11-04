import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostList from '../components/PostList';
import UserCard from '../components/UserCard';
import { SkeletonLoader, PostSkeleton } from '../components/SkeletonLoader';
import type { FollowData, UserProfile, PublicProfilePageView } from '../types';

function PublicProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PublicProfilePageView>('posts');
  const [followers, setFollowers] = useState<FollowData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const { username } = useParams();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setProfile(null);
        } else {
          const profileData = data as UserProfile;
          setProfile(profileData);
          fetch(`/api/users/${profileData.id}/followers`).then(res => res.json()).then((d: FollowData[]) => setFollowers(d));
          fetch(`/api/users/${profileData.id}/following`).then(res => res.json()).then((d: FollowData[]) => setFollowing(d));
        }
        setLoading(false);
      });
  }, [username]);

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

  if (!profile) return <div className="p-8"><h2 className="text-primary-text">User not found: {username}</h2></div>;

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
      </div>

      <div className="border-b border-primary-border flex justify-around bg-surface">
        <button onClick={() => setView('posts')} className={tabButtonClasses('posts')}>
          <span className="font-bold text-lg">{postCount}</span>
          <span className="text-sm">Posts</span>
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
    </div>
  );
}

export default PublicProfilePage;