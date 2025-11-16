import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Conversation, Participant, Role } from '../types';
import { X, Users, Camera, Edit2, Shield, Trash2, LogOut, UserPlus, MoreVertical, UserX, Check } from 'lucide-react';
import { uploadToCloudinary } from '../utils/upload';
import AddMemberModal from './AddMemberModal';
import ConfirmationModal from './ConfirmationModal';

interface GroupInfoModalProps {
    initialConversation: Conversation;
    onClose: () => void;
    onConversationUpdate: () => void;
    onConversationDeleted: () => void;
}

export default function GroupInfoModal({
    initialConversation,
    onClose,
    onConversationUpdate,
    onConversationDeleted
}: GroupInfoModalProps) {
    const { user, token } = useAuth();

    // State
    const [conversation, setConversation] = useState(initialConversation);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openMenuForUser, setOpenMenuForUser] = useState<number | null>(null);
    type ConfirmAction = null | 'kick' | 'leave' | 'delete';
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [targetParticipant, setTargetParticipant] = useState<Participant | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [groupName, setGroupName] = useState(conversation.name || '');

    // Get current user's role
    const myParticipant = conversation.participants.find(p => p.user_id === user?.id);
    const myRole = myParticipant?.role;
    const isAdmin = myRole === 'ADMIN';

    // Re-usable fetch wrapper
    const apiFetch = async (url: string, options: RequestInit) => {
        setError(null);
        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers,
                },
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'An error occurred');
            }
            return res.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    // --- Edit Group Details ---
    const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !token) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const secure_url = await uploadToCloudinary(file, token);
            const updatedConvo = await apiFetch(`/api/conversations/${conversation.id}/details`, {
                method: 'PATCH',
                body: JSON.stringify({ picture_url: secure_url })
            });
            setConversation(prev => ({ ...prev, picture_url: updatedConvo.picture_url }));
            onConversationUpdate();
        } catch (err) { /* error is set by apiFetch */ }
        finally { setIsUploading(false); }
    };

    const handleSaveDetails = async () => {
        try {
            const updatedConvo = await apiFetch(`/api/conversations/${conversation.id}/details`, {
                method: 'PATCH',
                body: JSON.stringify({ name: groupName })
            });
            setConversation(prev => ({ ...prev, name: updatedConvo.name }));
            onConversationUpdate();
            setIsEditing(false);
        } catch (err) { /* error is set by apiFetch */ }
    };

    const handleRemovePfp = async () => {
        if (isUploading) return;
        try {
            const updatedConvo = await apiFetch(`/api/conversations/${conversation.id}/details`, {
                method: 'PATCH',
                body: JSON.stringify({ picture_url: null })
            });
            setConversation(prev => ({ ...prev, picture_url: updatedConvo.picture_url }));
            onConversationUpdate();
        } catch (err) { /* error is set by apiFetch */ }
    };

    // --- Participant Actions ---
    const handleRoleChange = async (targetUser: Participant, newRole: Role) => {
        try {
            await apiFetch(`/api/conversations/${conversation.id}/participants/${targetUser.user_id}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });
            setConversation(prev => ({
                ...prev,
                participants: prev.participants.map(p =>
                    p.user_id === targetUser.user_id ? { ...p, role: newRole } : p
                )
            }));
        } catch (err) { /* error is set by apiFetch */ }
    };

    const handleKickParticipant = async () => {
        if (!targetParticipant) return;
        setIsProcessing(true);
        try {
            await apiFetch(`/api/conversations/${conversation.id}/participants/${targetParticipant.user_id}`, {
                method: 'DELETE',
            });
            setConversation(prev => ({
                ...prev,
                participants: prev.participants.filter(p => p.user_id !== targetParticipant.user_id)
            }));
        } catch (err) { /* error is set */ }
        finally {
            setIsProcessing(false);
            setConfirmAction(null);
            setTargetParticipant(null);
        }
    };

    // --- Group Actions ---
    const handleLeaveGroup = async () => {
        setIsProcessing(true);
        try {
            await apiFetch(`/api/conversations/${conversation.id}/leave`, { method: 'DELETE' });
            onConversationDeleted();
        } catch (err) { /* error is set */ }
        finally {
            setIsProcessing(false);
            setConfirmAction(null);
        }
    };

    const handleDeleteGroup = async () => {
        setIsProcessing(true);
        try {
            await apiFetch(`/api/conversations/${conversation.id}`, { method: 'DELETE' });
            onConversationDeleted();
        } catch (err) { /* error is set */ }
        finally {
            setIsProcessing(false);
            setConfirmAction(null);
        }
    };

    const renderConfirmationModal = () => {
        if (!confirmAction) return null;
        let props = {
            title: "Are you sure?",
            message: "This action cannot be undone.",
            confirmText: "Confirm",
            onConfirm: () => { },
        };
        switch (confirmAction) {
            case 'kick':
                props.title = `Kick ${targetParticipant?.user.username}?`;
                props.message = `Are you sure you want to kick ${targetParticipant?.user.username}? They will have to be re-invited.`;
                props.confirmText = "Kick User";
                props.onConfirm = handleKickParticipant;
                break;
            case 'leave':
                props.title = "Leave Group?";
                props.message = "Are you sure you want to leave this group? You will have to be re-invited.";
                props.confirmText = "Leave";
                props.onConfirm = handleLeaveGroup;
                break;
            case 'delete':
                props.title = "Delete Group?";
                props.message = "Are you sure you want to permanently delete this group? This action is final and cannot be undone.";
                props.confirmText = "Delete Group";
                props.onConfirm = handleDeleteGroup;
                break;
        }
        return (
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => { setConfirmAction(null); setTargetParticipant(null); }}
                onConfirm={props.onConfirm}
                title={props.title}
                message={props.message}
                confirmText={props.confirmText}
                confirmVariant="danger"
                isLoading={isProcessing}
            />
        );
    };

    const handleCloseModal = () => {
        setOpenMenuForUser(null);
        onClose();
    };

    return (
        <>
            <div
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4"
                onClick={handleCloseModal}
            >
                <div
                    className="bg-surface rounded-lg p-6 w-full max-w-md flex flex-col gap-4 max-h-[80vh]"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuForUser(null);
                    }}
                >
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-primary-text">Group Info</h2>
                        <button onClick={handleCloseModal} className="p-1 rounded-full text-secondary-text hover:bg-primary-border">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="relative flex flex-col items-center">
                        <div className="relative w-24 h-24">
                            {conversation.picture_url ? (
                                <img src={conversation.picture_url} alt="Group" className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-primary-border flex items-center justify-center">
                                    <Users size={48} className="text-secondary-text" />
                                </div>
                            )}
                            {isAdmin && (
                                <>
                                    <label className="absolute bottom-0 right-0 p-2 bg-accent text-white rounded-full cursor-pointer hover:brightness-90">
                                        <Camera size={16} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePfpChange} disabled={isUploading} />
                                    </label>
                                    {conversation.picture_url && (
                                        <button
                                            onClick={handleRemovePfp}
                                            disabled={isUploading}
                                            className="absolute bottom-0 left-0 p-2 bg-red-600 text-white rounded-full cursor-pointer hover:bg-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="flex gap-2 mt-4">
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="p-1 border border-primary-border rounded-md bg-background text-primary-text"
                                />
                                <button onClick={handleSaveDetails} className="p-1 rounded-md text-green-500 hover:bg-primary-border"><Check size={20} /></button>
                                <button onClick={() => setIsEditing(false)} className="p-1 rounded-md text-red-500 hover:bg-primary-border"><X size={20} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mt-4">
                                <p className="text-lg font-semibold text-primary-text">{conversation.name}</p>
                                {isAdmin && (
                                    <button onClick={() => setIsEditing(true)} className="p-1 rounded-full text-secondary-text hover:bg-primary-border">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                        {isUploading && <p className="text-sm text-accent">Uploading...</p>}
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 border-t border-b border-primary-border py-4 scrollbar-hide">
                        <h3 className="font-semibold text-primary-text mb-2">{conversation.participants.length} Members</h3>
                        {conversation.participants.map(p => (
                            <ParticipantItem
                                key={p.user_id}
                                participant={p}
                                isAdmin={isAdmin}
                                isSelf={p.user_id === user?.id}
                                isMenuOpen={openMenuForUser === p.user_id}
                                onToggleMenu={() => setOpenMenuForUser(prev =>
                                    prev === p.user_id ? null : p.user_id
                                )}
                                onRoleChange={handleRoleChange}
                                onKick={() => {
                                    setTargetParticipant(p);
                                    setConfirmAction('kick');
                                }}
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => setIsAddingMember(true)}
                                className="flex items-center justify-center gap-2 w-full p-2 bg-accent text-white font-semibold rounded-lg hover:brightness-90"
                            >
                                <UserPlus size={18} /> Add Member
                            </button>
                        )}
                        <button
                            onClick={() => setConfirmAction('leave')} // <-- No window.confirm
                            className="flex items-center justify-center gap-2 w-full p-2 bg-red-600/10 text-red-500 font-semibold rounded-lg hover:bg-red-600/20"
                        >
                            <LogOut size={18} /> Leave Group
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setConfirmAction('delete')}
                                className="flex items-center justify-center gap-2 w-full p-2 bg-red-600/10 text-red-500 font-semibold rounded-lg hover:bg-red-600/20"
                            >
                                <Trash2 size={18} /> Delete Group
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {renderConfirmationModal()}
            {isAddingMember && isAdmin && (
                <AddMemberModal
                    conversation={conversation}
                    onClose={() => setIsAddingMember(false)}
                    onMemberAdded={(newParticipant) => {
                        setConversation(prev => ({ ...prev, participants: [...prev.participants, newParticipant] }));
                        setIsAddingMember(false);
                    }}
                />
            )}
        </>
    );
}

// --- Sub-Component for Participant List Item ---
interface ParticipantItemProps {
    participant: Participant;
    isAdmin: boolean;
    isSelf: boolean;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onRoleChange: (p: Participant, role: Role) => void;
    onKick: (p: Participant) => void;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({
    participant,
    isAdmin,
    isSelf,
    isMenuOpen,
    onToggleMenu,
    onRoleChange,
    onKick
}) => {
    const pfp = participant.user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${participant.user.username}`;
    return (
        <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-primary-border/50"
            onClick={() => onToggleMenu()}
        >
            <Link to={`/${participant.user.username}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                <img src={pfp} alt={participant.user.username} className="w-8 h-8 rounded-full object-cover" />
                <div>
                    <p className="font-semibold text-primary-text">{participant.user.username} {isSelf && '(You)'}</p>
                    {participant.role === 'ADMIN' && <p className="text-xs text-accent font-semibold">Admin</p>}
                </div>
            </Link>
            {isAdmin && !isSelf && (
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleMenu();
                        }}
                        className="p-1 rounded-full text-secondary-text hover:bg-primary-border"
                    >
                        <MoreVertical size={18} />
                    </button>
                    <div
                        className={`absolute right-0 top-full mt-1 w-48 bg-surface border border-primary-border rounded-lg shadow-lg z-30 ${isMenuOpen ? 'block' : 'hidden'}`}
                        onClick={(e) => e.stopPropagation()}
                        onMouseLeave={() => onToggleMenu()}
                    >
                        {participant.role === 'MEMBER' ? (
                            <button
                                onClick={() => onRoleChange(participant, 'ADMIN')}
                                className="w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-primary-border flex items-center gap-2"
                            >
                                <Shield size={16} /> Promote to Admin
                            </button>
                        ) : (
                            <button
                                onClick={() => onRoleChange(participant, 'MEMBER')}
                                className="w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-primary-border flex items-center gap-2"
                            >
                                <Shield size={16} /> Demote to Member
                            </button>
                        )}
                        <button
                            onClick={() => onKick(participant)}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <UserX size={16} /> Kick from Group
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};