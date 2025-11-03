import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// 1. Import desired icons from lucide-react
import {
  Heart, ThumbsUp, ThumbsDown, Laugh, Angry, PartyPopper, SmilePlus, Star,
  Annoyed, BicepsFlexed, Frown, HandFist, HandHelping, HandMetal, HeartCrack,
  HeartHandshake, LeafyGreen, Meh, Ribbon, Salad, Smile
} from 'lucide-react';

// 2. Define available reactions with icons and styling
const reactionMap = {
  like: { Icon: ThumbsUp, color: 'text-accent' },        // Blue
  love: { Icon: Heart, color: 'text-red-500' },
  laugh: { Icon: Laugh, color: 'text-yellow-500' },
  dislike: { Icon: ThumbsDown, color: 'text-purple-500' },
  angry: { Icon: Angry, color: 'text-orange-600' },
  party: { Icon: PartyPopper, color: 'text-indigo-500' },
  star: { Icon: Star, color: 'text-yellow-400' },
  smile: { Icon: Smile, color: 'text-green-500' },
  annoyed: { Icon: Annoyed, color: 'text-pink-600' },
  strong: { Icon: BicepsFlexed, color: 'text-orange-400' }, // Using BicepsFlexed for "strong"
  frown: { Icon: Frown, color: 'text-blue-400' },          // Using Frown instead of Sad
  fist: { Icon: HandFist, color: 'text-gray-600' },      // Using HandFist for "fist" or "solidarity"
  help: { Icon: HandHelping, color: 'text-teal-500' },    // Using HandHelping for "help" or "support"
  metal: { Icon: HandMetal, color: 'text-gray-700' },      // Using HandMetal for "metal" or "rock on"
  broken: { Icon: HeartCrack, color: 'text-red-700' },     // Using HeartCrack for "broken"
  care: { Icon: HeartHandshake, color: 'text-pink-400' }, // Using HeartHandshake for "care" or "agreement"
  healthy: { Icon: LeafyGreen, color: 'text-lime-600' },    // Using LeafyGreen for "healthy" or "nature"
  meh: { Icon: Meh, color: 'text-gray-400' },
  celebrate: { Icon: Ribbon, color: 'text-purple-600' },    // Using Ribbon for "celebrate" or "award"
  salad: { Icon: Salad, color: 'text-green-600' },
  // SmilePlus is used as the default 'React' icon, maybe don't include in picker?
};
const availableReactions = Object.keys(reactionMap); // All keys

function ReactionSection({ postId }) {
  const [reactions, setReactions] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const { user, token } = useAuth();

  const fetchReactions = () => {
    if (!postId) return;
    fetch(`http://localhost:3000/posts/${postId}/reactions`)
      .then(res => res.json())
      .then(data => setReactions(data))
      .catch(error => console.error("Error fetching reactions:", error));
  };

  useEffect(() => {
    fetchReactions();
  }, [postId]); // Fetch only when postId changes

  // Handle sending the reaction AND closing the picker
  const handleReact = (reactionType) => {
    if (!user || !token) return;
    fetch(`http://localhost:3000/posts/${postId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reaction_type: reactionType }),
    })
      .then(() => {
        fetchReactions(); // Refresh reactions
        setShowPicker(false); // **Close picker after action**
      })
      .catch(error => console.error("Error sending reaction:", error));
  };

  // Find the current user's reaction
  const userReaction = reactions.find(r => r.user_id === user?.id);
  const UserReactionIcon = userReaction ? reactionMap[userReaction.reaction_type]?.Icon : null;
  const userReactionColor = userReaction ? reactionMap[userReaction.reaction_type]?.color : 'text-secondary-text';
  const reactionCount = reactions.length;

  // --- NEW CLICK HANDLER for the main button ---
  const handleReactButtonClick = () => {
    if (userReaction) {
      // If user has reacted, clicking the button un-reacts
      handleReact(userReaction.reaction_type);
    } else {
      // If user has not reacted, clicking toggles the picker
      setShowPicker(!showPicker);
    }
  };

  return (
    <div className="flex items-center gap-4 mt-4 relative">
      {/* --- React Button --- */}
      {/* This button toggles the picker if no reaction is set, or un-reacts if one is set */}
      <button
        onClick={handleReactButtonClick}
        className={`flex items-center gap-1 font-semibold text-sm p-1 rounded transition-colors duration-200 ${userReaction ? userReactionColor : 'text-secondary-text hover:bg-primary-border'
          }`}
      >
        {UserReactionIcon ? <UserReactionIcon size={18} /> : <SmilePlus size={18} />}
        <span>{userReaction ? userReaction.reaction_type : 'React'}</span>
      </button>

      {/* --- Reaction Picker (Grid Layout) --- */}
      {showPicker && (
        <div
          className="absolute bottom-full mb-2 p-2 bg-surface border border-primary-border rounded-lg shadow-lg z-10 
                     grid grid-cols-10 gap-1 w-max max-w-sm" // Use grid, 10 columns, limit width
        >
          {availableReactions.map(type => {
            const { Icon, color } = reactionMap[type];
            return (
              <button
                key={type}
                onClick={() => handleReact(type)} // Click sends reaction & closes picker
                className="p-1 rounded-full flex items-center justify-center hover:bg-primary-border transition-transform duration-150 ease-in-out" // Center icon, add transition
                aria-label={`React with ${type}`} // Accessibility label
              >
                <Icon size={22} className={`${color} hover:scale-125`} />
              </button>
            );
          })}
        </div>
      )}

      {/* --- Reaction Count --- */}
      {reactionCount > 0 && (
        <span className="text-sm text-secondary-text">{reactionCount}</span>
      )}
    </div>
  );
} // Closing bracket for the ReactionSection function

export default ReactionSection; // Ensure the export is present