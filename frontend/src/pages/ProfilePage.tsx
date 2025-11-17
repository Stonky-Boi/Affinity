import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { Trash2, X } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { uploadToCloudinary } from '../utils/upload';

function ProfilePage() {
    const { user, token, login, logout } = useAuth();
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        bio: user?.bio || '',
        picture_url: user?.picture_url || null,
        date_of_birth: user?.date_of_birth ? user.date_of_birth.split('T')[0] : '',
        phone: user?.phone || '',
        alternate_email: user?.alternate_email || '',
        privacy_settings: user?.settings || { is_private: false }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState<{ error: string | null, success: boolean }>({ error: null, success: false });
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadController, setUploadController] = useState<AbortController | null>(null);
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
    const [blockError, setBlockError] = useState<string | null>(null);

    const fetchBlockedUsers = () => {
        if (!token) return;
        setIsLoadingBlocks(true);
        setBlockError(null);
        fetch('/api/block/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch blocked users.');
                return res.json();
            })
            .then((data: User[]) => setBlockedUsers(data))
            .catch(err => setBlockError(err.message))
            .finally(() => setIsLoadingBlocks(false));
    };
    useEffect(() => {
        fetchBlockedUsers();
    }, [token]);

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
        setIsDeleting(true);
        try {
            const response = await fetch('/api/users/profile', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete account.');
            }
            alert('Account deleted successfully.');
            setIsDeleteModalOpen(false);
            logout(user.id);
        } catch (error: any) {
            setDeleteError(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUnblock = async (userId: number) => {
        if (!token) return;
        try {
            const response = await fetch(`/api/block/user/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to unblock user.');
            fetchBlockedUsers();
        } catch (err: any) {
            setBlockError(err.message);
        }
    };

    const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !token) {
            return;
        }
        const file = e.target.files[0];
        const controller = new AbortController();
        setUploadController(controller);
        setIsUploading(true);
        setFormState({ error: null, success: false });
        setUploadProgress(0);
        try {
            const secure_url = await uploadToCloudinary(file, token, {
                onProgress: (progress) => setUploadProgress(progress),
                abortSignal: controller.signal,
            });
            setFormData(prev => ({ ...prev, picture_url: secure_url }));
            setFormState({ error: null, success: true });
        } catch (err: any) {
            if (err.message !== "Upload canceled.") {
                setFormState({ error: err.message, success: false });
            }
        } finally {
            setIsUploading(false);
            setUploadController(null);
        }
    };

    const handleCancelUpload = () => {
        if (uploadController) {
            uploadController.abort();
            setUploadProgress(0);
        }
    };

    const inputClasses = "p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text";

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-primary-text">Edit Your Profile</h1>
            <div className="mb-4">
                <img
                    src={formData.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username}`}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover mb-2"
                />
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePicChange}
                        disabled={isUploading}
                        className="text-sm text-secondary-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-border file:text-primary-text hover:file:brightness-90"
                    />
                    {formData.picture_url && (
                        <button
                            type="button"
                            onClick={() => {
                                setFormData(prev => ({ ...prev, picture_url: null }));
                                setFormState({ error: null, success: false });
                            }}
                            disabled={isUploading}
                            className="px-4 py-2 bg-red-600/10 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-600/20"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
                {isUploading && (
                    <div className="flex items-center gap-4 mt-2 max-w-sm">
                        <div className="flex-grow bg-primary-border rounded-full h-2.5">
                            <div
                                className="bg-accent h-2.5 rounded-full transition-all duration-150"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold text-primary-text">{uploadProgress}%</span>
                        <button
                            type="button"
                            onClick={handleCancelUpload}
                            className="p-1 rounded-full text-secondary-text hover:bg-red-500/10 hover:text-red-500"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>
            <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" className={inputClasses} />
                    <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" className={inputClasses} />
                </div>
                <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Your Bio" className={`w-full ${inputClasses}`} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className={inputClasses} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className={inputClasses} />
                    <input name="alternate_email" type="email" value={formData.alternate_email} onChange={handleChange} placeholder="Alternate Email" className={inputClasses} />
                </div>
                <div className="flex items-center justify-between p-4 border border-primary-border rounded-lg">
                    <div>
                        <label className="font-semibold text-primary-text">Private Account</label>
                        <p className="text-sm text-secondary-text">
                            If enabled, people will have to request to follow you.
                        </p>
                    </div>
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded text-accent focus:ring-accent"
                        checked={!!(formData.privacy_settings as any)?.is_private}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            privacy_settings: { ...prev.privacy_settings, is_private: e.target.checked }
                        }))}
                    />
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
            <div className="mt-12 border-t border-primary-border/30 pt-6 max-w-2xl">
                <h2 className="text-xl font-bold text-primary-text">Manage Blocked Users</h2>
                <p className="text-secondary-text my-2">
                    Users you block cannot see your profile or interact with you.
                </p>
                <div className="space-y-2">
                    {isLoadingBlocks ? (
                        <SkeletonLoader className="h-16 w-full" />
                    ) : blockError ? (
                        <p className="text-red-500">{blockError}</p>
                    ) : blockedUsers.length === 0 ? (
                        <p className="text-secondary-text">You haven't blocked anyone.</p>
                    ) : (
                        blockedUsers.map(blockedUser => (
                            <div key={blockedUser.id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                                <p className="font-semibold">{blockedUser.username}</p>
                                <button
                                    onClick={() => handleUnblock(blockedUser.id)}
                                    className="px-3 py-1 text-sm font-semibold bg-primary-border rounded-lg hover:brightness-90"
                                >
                                    Unblock
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="mt-12 border-t border-red-500/30 pt-6 max-w-2xl">
                <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                <p className="text-secondary-text my-2">
                    Deleting your account is permanent. All of your data will be anonymized, and you will be logged out.
                </p>
                <button
                    onClick={() => {
                        setDeleteError(null);
                        setIsDeleteModalOpen(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                >
                    Delete My Account
                </button>
                {deleteError && !isDeleteModalOpen && (
                    <p className="text-red-500 text-sm mt-2">{deleteError}</p>
                )}
            </div>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Are you absolutely sure?"
                message={`This action is permanent and cannot be undone.\nAll your data will be anonymized, and you will be logged out immediately.${deleteError ? `\n\nError: ${deleteError}` : ''}`}
                confirmText="Confirm Delete"
                confirmVariant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}

export default ProfilePage;