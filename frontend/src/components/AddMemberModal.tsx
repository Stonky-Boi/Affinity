import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Conversation, Participant, User } from '../types';
import { X } from 'lucide-react';

interface AddMemberModalProps {
    conversation: Conversation;
    onClose: () => void;
    onMemberAdded: (participant: Participant) => void;
}

export default function AddMemberModal({ conversation, onClose, onMemberAdded }: AddMemberModalProps) {
    const { token } = useAuth();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: mutuals, isLoading: isLoadingMutuals } = useApi<User[]>(
        token ? '/api/users/mutuals' : null
    );
    const existingParticipantIds = new Set(conversation.participants.map(p => p.user_id));
    const addableUsers = mutuals?.filter(u => !existingParticipantIds.has(u.id)) || [];
    const handleAddMember = async () => {
        if (!selectedUser || !token) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/conversations/${conversation.id}/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: selectedUser.id })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to add member');
            }
            const newParticipant: Participant = await res.json();
            const fullNewParticipant = { ...newParticipant, user: selectedUser };
            onMemberAdded(fullNewParticipant);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30 p-4" onClick={onClose}>
            <div className="bg-surface rounded-lg p-6 w-full max-w-sm flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-primary-text">Add Member</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-secondary-text hover:bg-primary-border">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-secondary-text">Select a friend to add to the group:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-primary-border rounded-lg p-2">
                    {isLoadingMutuals ? (
                        <p className="text-secondary-text text-center">Loading friends...</p>
                    ) : addableUsers.length === 0 ? (
                        <p className="text-secondary-text text-center">No friends to add.</p>
                    ) : (
                        addableUsers.map(user => {
                            const isSelected = selectedUser?.id === user.id;
                            const pfp = user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`;
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 ${isSelected ? 'bg-accent/20' : 'hover:bg-primary-border'}`}
                                >
                                    <img src={pfp} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                                    <span className={`font-semibold text-primary-text ${isSelected ? 'font-bold' : ''}`}>{user.username}</span>
                                </div>
                            );
                        })
                    )}
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-primary-border text-primary-text font-semibold py-2 rounded-lg hover:brightness-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddMember}
                        disabled={!selectedUser || isLoading}
                        className="flex-1 bg-accent text-white font-semibold py-2 rounded-lg hover:brightness-90 disabled:opacity-50"
                    >
                        {isLoading ? 'Adding...' : 'Add to Group'}
                    </button>
                </div>
            </div>
        </div>
    );
}