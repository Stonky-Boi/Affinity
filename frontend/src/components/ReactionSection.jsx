import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// We'll assume the current user is user ID 1 for now
const CURRENT_USER_ID = 1;

function ReactionSection({ postId }) {
  const [reactions, setReactions] = useState([]);
  const [userHasReacted, setUserHasReacted] = useState(false);
  const { user } = useAuth();

  // Function to fetch the latest reactions for this post
  const fetchReactions = () => {
    if (!postId) return;
    fetch(`http://localhost:3000/posts/${postId}/reactions`)
      .then(response => response.json())
      .then(data => {
        setReactions(data);
        // Check if the current user's ID is in the list of reactions
        if (user) {
          setUserHasReacted(data.some(reaction => reaction.user_id === user.id));
        }
      })
      .catch(error => console.error('Error fetching reactions:', error));
  };

  // Fetch reactions when the component first loads
  useEffect(() => {
    fetchReactions();
  }, [postId, user]);

  // Function to handle the like/unlike button click
  const handleReact = () => {
    if (!user) return; // Prevent non-logged-in users from reacting

    fetch(`http://localhost:3000/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }), // 3. Use the real user's ID
    })
    .then(fetchReactions);
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <button onClick={handleReact} className="text-2xl">
        {userHasReacted ? '❤️' : '🤍'}
      </button>
      <span className="font-semibold">{reactions.length}</span>
    </div>
  );
}

export default ReactionSection;