import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostList from '../components/PostList';
import UserCard from '../components/UserCard';

function PublicProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('posts'); // 'posts', 'followers', or 'following'
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
          // After getting profile, fetch followers and following lists
          fetch(`http://localhost:3000/users/${data.id}/followers`).then(res => res.json()).then(setFollowers);
          fetch(`http://localhost:3000/users/${data.id}/following`).then(res => res.json()).then(setFollowing);
        }
        setLoading(false);
      });
  }, [username]);

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!profile) return <div className="p-8"><h2>User not found: {username}</h2></div>;

  const profilePic = profile.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username}`;

  return (
    <div>
      {/* Profile Header */}
      <div className="p-8 bg-white border-b">
        <img src={profilePic} alt={profile.username} className="w-24 h-24 rounded-full mb-4 object-cover" />
        <h1 className="text-3xl font-bold">{profile.first_name || profile.username}</h1>
        <p className="text-gray-600">@{profile.username}</p>
        <p className="mt-4">{profile.bio || "This user hasn't written a bio yet."}</p>
        <div className="mt-4 flex space-x-6">
          <span className="font-semibold">{profile.posts?.length || 0} Posts</span>
          <span className="font-semibold">{followers.length} Followers</span>
          <span className="font-semibold">{following.length} Following</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b flex">
        <button onClick={() => setView('posts')} className={`py-2 px-4 font-semibold ${view === 'posts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Posts</button>
        <button onClick={() => setView('followers')} className={`py-2 px-4 font-semibold ${view === 'followers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Followers</button>
        <button onClick={() => setView('following')} className={`py-2 px-4 font-semibold ${view === 'following' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Following</button>
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