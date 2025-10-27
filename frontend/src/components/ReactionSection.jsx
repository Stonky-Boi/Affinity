import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// 1. Import desired icons from lucide-react
import { Heart, ThumbsUp, Laugh, SmilePlus } from 'lucide-react';

// 2. Define available reactions with icons and styling
const reactionMap = {
  like: { Icon: ThumbsUp, color: 'text-accent' }, // Use semantic accent color
  heart: { Icon: Heart, color: 'text-red-500' },
  laugh: { Icon: Laugh, color: 'text-yellow-500' },
};
const availableReactions = Object.keys(reactionMap); // ['like', 'heart', 'laugh']

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
    // Removed hover handlers from the container
    <div className="flex items-center gap-4 mt-4 relative">
      {/* React Button uses the new click handler */}
      <button
        onClick={handleReactButtonClick} // Use the new handler
        className={`flex items-center gap-1 font-semibold text-sm p-1 rounded ${userReaction ? userReactionColor : 'text-secondary-text hover:bg-primary-border'}`}
      >
        {UserReactionIcon ? <UserReactionIcon size={18} /> : <SmilePlus size={18} />}
        <span>{userReaction ? userReaction.reaction_type : 'React'}</span>
      </button>

      {/* Reaction Picker - Stays open until a reaction is clicked or button is clicked again */}
      {showPicker && (
        // Removed hover handlers from the picker div
        <div className="absolute bottom-full mb-2 flex gap-2 p-2 bg-surface border border-primary-border rounded-full shadow-lg z-10">
          {availableReactions.map(type => {
            const { Icon, color } = reactionMap[type];
            return (
              <button
                key={type}
                onClick={() => handleReact(type)} // Clicking an icon sends reaction & closes picker
                className="p-1 rounded-full hover:bg-primary-border"
              >
                <Icon size={24} className={`${color} hover:scale-125 transition-transform`} />
              </button>
            );
          })}
        </div>
      )}

      {/* Reaction Count (unchanged) */}
      {reactionCount > 0 && (
        <span className="text-sm text-secondary-text">{reactionCount}</span>
      )}
    </div>
  );
}
export default ReactionSection;