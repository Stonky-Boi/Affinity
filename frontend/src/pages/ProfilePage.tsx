import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import type { User, FollowData, ProfilePageView } from '../types';

function ProfilePage() {
  const { user, token, login } = useAuth();
  const userProfile = user as User | null;

  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || '',
    last_name: userProfile?.last_name || '',
    bio: userProfile?.bio || '',
    picture_url: userProfile?.picture_url || '',
    date_of_birth: userProfile?.date_of_birth ? userProfile.date_of_birth.split('T')[0] : '',
    country: userProfile?.country || '',
    state: userProfile?.state || '',
    city: userProfile?.city || '',
    phone: userProfile?.phone || '',
    alternate_email: userProfile?.alternate_email || ''
  });

  const [followers, setFollowers] = useState<FollowData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [view, setView] = useState<ProfilePageView>('edit');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('You are not authenticated.');
      return;
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const updatedUser = await response.json();
      login(updatedUser, token);
      alert('Profile saved successfully!');
    } catch (error) {
      alert('Failed to save profile.');
    }
  };

  useEffect(() => {
    if (userProfile && token) {
      fetch(`/api/users/${userProfile.id}/followers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then((data: FollowData[]) => setFollowers(data))
        .catch(error => console.error("Error fetching followers:", error));

      fetch(`/api/users/${userProfile.id}/following`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then((data: FollowData[]) => setFollowing(data))
        .catch(error => console.error("Error fetching following:", error));
    }
  }, [userProfile, token]);

  const inputClasses = "p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text";

  const tabButtonClasses = (tabName: ProfilePageView) =>
    `py-2 px-4 font-semibold ${view === tabName ? 'border-b-2 border-accent text-accent' : 'text-secondary-text hover:text-primary-text'}`;

  return (
    <div className="p-8">
      <div className="mb-6 border-b border-primary-border flex">
        <button onClick={() => setView('edit')} className={tabButtonClasses('edit')}>Edit Profile</button>
        <button onClick={() => setView('followers')} className={tabButtonClasses('followers')}>Followers ({followers.length})</button>
        <button onClick={() => setView('following')} className={tabButtonClasses('following')}>Following ({following.length})</button>
      </div>

      {view === 'edit' && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-primary-text">Edit Your Profile</h1>
          <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" className={inputClasses} />
              <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" className={inputClasses} />
            </div>
            <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Your Bio" className={`w-full ${inputClasses}`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="picture_url" value={formData.picture_url} onChange={handleChange} placeholder="Profile Picture URL" className={inputClasses} />
              <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className={inputClasses} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="country" value={formData.country} onChange={handleChange} placeholder="Country" className={inputClasses} />
              <input name="state" value={formData.state} onChange={handleChange} placeholder="State" className={inputClasses} />
              <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className={inputClasses} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className={inputClasses} />
              <input name="alternate_email" type="email" value={formData.alternate_email} onChange={handleChange} placeholder="Alternate Email" className={inputClasses} />
            </div>
            <button type="submit" className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:brightness-90">
              Save Changes
            </button>
          </form>
        </>
      )}

      {view === 'followers' && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-primary-text">Your Followers</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followers.length > 0 ? (
              followers.map(f => <UserCard key={f.follower_id} user={f.follower!} />)
            ) : (
              <p className="text-secondary-text col-span-full">You don't have any followers yet.</p>
            )}
          </div>
        </>
      )}

      {view === 'following' && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-primary-text">Following</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {following.length > 0 ? (
              following.map(f => <UserCard key={f.following_id} user={f.following!} />)
            ) : (
              <p className="text-secondary-text col-span-full">You aren't following anyone yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProfilePage;