import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostList from '../components/PostList';
import UserCard from '../components/UserCard';
import { SkeletonLoader, PostSkeleton } from '../components/SkeletonLoader'; // Assuming you have these

function PublicProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const { username } = useParams();

  useEffect(() => {
    setLoading(true);
    // Fetch main profile data
    fetch(`http://localhost:3000/users/${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setProfile(null);
        } else {
          setProfile(data);
          // Fetch followers and following lists
          fetch(`http://localhost:3000/users/${data.id}/followers`).then(res => res.json()).then(setFollowers);
          fetch(`http://localhost:3000/users/${data.id}/following`).then(res => res.json()).then(setFollowing);
        }
        setLoading(false);
      });
  }, [username]);

  // --- Loading State Skeleton ---
  if (loading) {
    return (
      <div>
        {/* Profile Header Skeleton */}
        <div className="p-8 bg-surface border-b border-primary-border">
          <SkeletonLoader className="w-24 h-24 rounded-full mb-4" />
          <SkeletonLoader className="h-8 w-1/3 mb-2" />
          <SkeletonLoader className="h-4 w-1/4 mb-4" />
          <SkeletonLoader className="h-4 w-3/4" />
        </div>
        {/* Tab Navigation Skeleton */}
        <div className="border-b border-primary-border flex bg-surface justify-around"> {/* Use justify-around */}
          <SkeletonLoader className="h-12 w-1/3 m-2" /> {/* Taller skeleton */}
          <SkeletonLoader className="h-12 w-1/3 m-2" />
          <SkeletonLoader className="h-12 w-1/3 m-2" />
        </div>
         {/* Post List Skeleton */}
         <div className="p-8 space-y-6"> <PostSkeleton /> <PostSkeleton /> </div>
      </div>
    );
  }
  // --- End Loading State ---

  if (!profile) return <div className="p-8"><h2 className="text-primary-text">User not found: {username}</h2></div>;

  const profilePic = profile.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username}`;

  // Helper for tab button classes
  const tabButtonClasses = (tabName) =>
    // Added flex, items-center, justify-center, text-center, w-1/3 for equal width
    `py-3 px-4 font-semibold flex flex-col items-center justify-center text-center w-1/3 transition-colors duration-200 ${
      view === tabName
        ? 'border-b-2 border-accent text-accent' // Active state
        : 'text-secondary-text hover:text-primary-text hover:bg-primary-border/50' // Inactive state + hover
    }`;

  // Get counts
  const postCount = profile.posts?.length || 0;
  const followerCount = followers.length;
  const followingCount = following.length;

  return (
    <div>
      {/* Profile Header - Removed the count display div */}
      <div className="p-8 bg-surface border-b border-primary-border">
        <img src={profilePic} alt={profile.username} className="w-24 h-24 rounded-full mb-4 object-cover" />
        <h1 className="text-3xl font-bold text-primary-text">{profile.first_name || profile.username}</h1>
        <p className="text-secondary-text">@{profile.username}</p>
        <p className="mt-4 text-primary-text">{profile.bio || "This user hasn't written a bio yet."}</p>
        {/* The count display span section is removed */}
      </div>

      {/* Tab Navigation - Updated Buttons */}
      {/* Added justify-around to space buttons evenly */}
      <div className="border-b border-primary-border flex justify-around bg-surface">
        {/* Button now includes count and label */}
        <button onClick={() => setView('posts')} className={tabButtonClasses('posts')}>
          <span className="font-bold text-lg">{postCount}</span> {/* Count */}
          <span className="text-sm">Posts</span>               {/* Label */}
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

      {/* Content based on selected tab */}
      <div className="p-8">
        {view === 'posts' && <PostList posts={profile.posts || []} />}
        {view === 'followers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followers.map(f => <UserCard key={f.follower_id} user={f.follower} />)}
          </div>
        )}
        {view === 'following' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {following.map(f => <UserCard key={f.following_id} user={f.following} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicProfilePage;