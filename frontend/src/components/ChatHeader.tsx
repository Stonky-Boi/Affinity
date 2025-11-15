import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Conversation, User } from '../types';
import { Users, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ChatHeaderProps {
    conversation: Conversation;
    onOpenInfo: () => void;
    onDeleteConversation: () => void;
}

const getOtherParticipant = (convo: Conversation, currentUserId?: number) => {
    return convo.participants.find(p => p.user_id !== currentUserId)?.user;
};

function ChatHeader({ conversation, onOpenInfo, onDeleteConversation }: ChatHeaderProps) {
    const { user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const isGroup = conversation.type === 'GROUP';
    let pfpUrl: string | null | undefined = null;
    let displayName: string = "Chat";
    let otherUser: User | undefined = undefined;
    if (isGroup) {
        pfpUrl = conversation.picture_url;
        displayName = conversation.name || 'Group Chat';
    } else {
        otherUser = getOtherParticipant(conversation, user?.id);
        if (otherUser) {
            pfpUrl = otherUser.picture_url;
            displayName = otherUser.username;
        }
    }

    const defaultPfp = `https://api.dicebear.com/8.x/initials/svg?seed=${displayName}`;

    const HeaderContent = () => (
        <div className="flex items-center gap-3">
            {pfpUrl ? (
                <img src={pfpUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
            ) : (isGroup ? (
                <div className="w-10 h-10 rounded-full bg-primary-border flex items-center justify-center">
                    <Users size={20} className="text-secondary-text" />
                </div>
            ) : (
                <img src={defaultPfp} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
            )
            )}
            <p className="font-semibold text-primary-text">{displayName}</p>
        </div>
    );

    return (
        <div className="p-4 border-b border-primary-border bg-surface flex justify-between items-center">
            {isGroup ? (
                <button onClick={onOpenInfo} className="hover:brightness-90 transition-all">
                    <HeaderContent />
                </button>
            ) : otherUser ? (
                <Link to={`/${otherUser.username}`} className="hover:brightness-90 transition-all">
                    <HeaderContent />
                </Link>
            ) : (
                <div className="cursor-default"><HeaderContent /></div>
            )}
            <div className="relative">
                <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="p-2 rounded-full hover:bg-primary-border text-secondary-text hover:text-primary-text"
                    aria-label="Conversation options"
                >
                    <MoreVertical size={20} />
                </button>
                {menuOpen && (
                    <div
                        className="absolute right-0 top-full mt-1 w-48 bg-surface border border-primary-border rounded-lg shadow-lg z-30"
                        onMouseLeave={() => setMenuOpen(false)}
                    >
                        {isGroup ? (
                            <button
                                onClick={() => { onOpenInfo(); setMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-primary-border flex items-center gap-2"
                            >
                                <Users size={16} /> Group Info
                            </button>
                        ) : (
                            <button
                                onClick={() => { onDeleteConversation(); setMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Delete Chat
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatHeader;