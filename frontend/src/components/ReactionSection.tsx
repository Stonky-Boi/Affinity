import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Heart, ThumbsUp, ThumbsDown, Laugh, Angry, PartyPopper, Star,
    Annoyed, BicepsFlexed, Frown, HandFist, HandHelping, HandMetal, HeartCrack,
    HeartHandshake, LeafyGreen, Meh, Ribbon, Salad, Smile
} from 'lucide-react';
import { SmilePlus, AlertCircle } from 'lucide-react';
import type { Reaction, ReactionKey, ReactionSectionProps } from '../types';
import { useApi } from '../hooks/useApi';

const reactionMap = {
    like: { Icon: ThumbsUp, color: 'text-accent' },
    love: { Icon: Heart, color: 'text-red-500' },
    laugh: { Icon: Laugh, color: 'text-yellow-500' },
    dislike: { Icon: ThumbsDown, color: 'text-purple-500' },
    angry: { Icon: Angry, color: 'text-orange-600' },
    party: { Icon: PartyPopper, color: 'text-indigo-500' },
    star: { Icon: Star, color: 'text-yellow-400' },
    smile: { Icon: Smile, color: 'text-green-500' },
    annoyed: { Icon: Annoyed, color: 'text-pink-600' },
    strong: { Icon: BicepsFlexed, color: 'text-orange-400' },
    frown: { Icon: Frown, color: 'text-blue-400' },
    fist: { Icon: HandFist, color: 'text-gray-600' },
    help: { Icon: HandHelping, color: 'text-teal-500' },
    metal: { Icon: HandMetal, color: 'text-gray-700' },
    broken: { Icon: HeartCrack, color: 'text-red-700' },
    care: { Icon: HeartHandshake, color: 'text-pink-400' },
    healthy: { Icon: LeafyGreen, color: 'text-lime-600' },
    meh: { Icon: Meh, color: 'text-gray-400' },
    celebrate: { Icon: Ribbon, color: 'text-purple-600' },
    salad: { Icon: Salad, color: 'text-green-600' },
};

const availableReactions = Object.keys(reactionMap) as ReactionKey[];

function ReactionSection({ postId }: ReactionSectionProps) {
    const [showPicker, setShowPicker] = useState(false);
    const { user, token } = useAuth();
    const { data: reactions, error, setError, refresh: fetchReactions } = useApi<Reaction[]>(
        `/api/posts/${postId}/reactions`
    );

    const handleReact = (reactionType: ReactionKey) => {
        if (!user || !token) return;
        setError(null);
        fetch(`/api/posts/${postId}/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ reaction_type: reactionType }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to send reaction.');
                return res.json();
            })
            .then(() => {
                fetchReactions();
                setShowPicker(false);
            })
            .catch(error => {
                console.error("Error sending reaction:", error);
                setError(error.message);
                // Clear error after 3 seconds
                setTimeout(() => setError(null), 3000);
            });
    };

    const reactionList = reactions || [];
    const userReaction = reactionList.find(r => r.user_id === user?.id); const UserReactionIcon = userReaction ? reactionMap[userReaction.reaction_type]?.Icon : null;
    const userReactionColor = userReaction ? reactionMap[userReaction.reaction_type]?.color : 'text-secondary-text';
    const reactionCount = reactionList.length;

    const handleReactButtonClick = () => {
        if (userReaction) {
            handleReact(userReaction.reaction_type);
        } else {
            setShowPicker(!showPicker);
        }
    };

    return (
        <div className="flex items-center gap-4 mt-4 relative">
            <button
                onClick={handleReactButtonClick}
                className={`flex items-center gap-1 font-semibold text-sm p-1 rounded transition-colors duration-200 ${userReaction ? userReactionColor : 'text-secondary-text hover:bg-primary-border'
                    }`}
            >
                {UserReactionIcon ? <UserReactionIcon size={18} /> : <SmilePlus size={18} />}
                <span>{userReaction ? userReaction.reaction_type : 'React'}</span>
            </button>
            {error && (
                <span title={error}>
                    <AlertCircle size={18} className="text-red-500" />
                </span>
            )}
            {showPicker && (
                <div className="absolute bottom-full mb-2 p-2 bg-surface border border-primary-border rounded-lg shadow-lg z-10 grid grid-cols-10 gap-1 w-max max-w-sm">
                    {availableReactions.map(type => {
                        const { Icon, color } = reactionMap[type];
                        return (
                            <button
                                key={type}
                                onClick={() => handleReact(type)}
                                className="p-1 rounded-full flex items-center justify-center hover:bg-primary-border transition-transform duration-150 ease-in-out"
                                aria-label={`React with ${type}`}
                            >
                                <Icon size={22} className={`${color} hover:scale-125`} />
                            </button>
                        );
                    })}
                </div>
            )}
            {reactionCount > 0 && (
                <span className="text-sm text-secondary-text">{reactionCount}</span>
            )}
        </div>
    );
}

export default ReactionSection;