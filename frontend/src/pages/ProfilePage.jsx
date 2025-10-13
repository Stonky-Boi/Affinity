import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, token, login } = useAuth();

  // Initialize state with the current user's data
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    picture_url: user?.picture_url || '',
    // Format date for the input field: YYYY-MM-DD
    date_of_birth: user?.date_of_birth ? user.date_of_birth.split('T')[0] : '',
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    phone: user?.phone || '',
    alternate_email: user?.alternate_email || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const updatedUser = await response.json();
      // Update the global user state
      login(updatedUser, token);
      alert('Profile saved successfully!');
    } catch (error) {
      alert('Failed to save profile.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Your Profile</h1>
      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" className="p-2 border rounded-lg" />
          <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" className="p-2 border rounded-lg" />
        </div>
        {/* Bio */}
        <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Your Bio" className="w-full p-2 border rounded-lg" />
        {/* Picture URL and DOB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="picture_url" value={formData.picture_url} onChange={handleChange} placeholder="Profile Picture URL" className="p-2 border rounded-lg" />
          <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className="p-2 border rounded-lg" />
        </div>
        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="country" value={formData.country} onChange={handleChange} placeholder="Country" className="p-2 border rounded-lg" />
          <input name="state" value={formData.state} onChange={handleChange} placeholder="State" className="p-2 border rounded-lg" />
          <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="p-2 border rounded-lg" />
        </div>
        {/* Contact */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="p-2 border rounded-lg" />
          <input name="alternate_email" type="email" value={formData.alternate_email} onChange={handleChange} placeholder="Alternate Email" className="p-2 border rounded-lg" />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;