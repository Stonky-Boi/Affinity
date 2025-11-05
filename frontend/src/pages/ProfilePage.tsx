import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

function ProfilePage() {
  const { user, token, login, logout } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    picture_url: user?.picture_url || '',
    date_of_birth: user?.date_of_birth ? user.date_of_birth.split('T')[0] : '',
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    phone: user?.phone || '',
    alternate_email: user?.alternate_email || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<{ error: string | null, success: boolean }>({ error: null, success: false });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormState({ error: null, success: false });
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save profile');
      }
      const updatedUser: User = await response.json();
      login(updatedUser, token); // Update context
      setFormState({ error: null, success: true }); // Show success
      setTimeout(() => setFormState({ error: null, success: false }), 3000); // Clear after 3s
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setFormState({ error: error.message, success: false }); // Show error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token || !user) return;
    setDeleteError(null);
    if (window.confirm("Are you SURE you want to delete your account? This is permanent and cannot be undone.")) {
      try {
        const response = await fetch('/api/users/profile', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to delete account.');
        }
        alert('Account deleted successfully.'); // Alert is fine for this destructive action
        logout(user.id); // Log the user out
      } catch (error: any) {
        setDeleteError(error.message); // Show error
      }
    }
  };

  const inputClasses = "p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text";

  return (
    <div className="p-8">
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
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:brightness-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          {formState.error && (
            <p className="text-red-500 text-sm mt-2">{formState.error}</p>
          )}
          {formState.success && (
            <p className="text-green-500 text-sm mt-2">Profile saved successfully!</p>
          )}
        </div>
      </form>
      <div className="mt-12 border-t border-red-500/30 pt-6 max-w-2xl">
        <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
        <p className="text-secondary-text my-2">
          Deleting your account is permanent. All of your data will be anonymized.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
        >
          Delete My Account
        </button>
        {deleteError && (
          <p className="text-red-500 text-sm mt-2">{deleteError}</p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;