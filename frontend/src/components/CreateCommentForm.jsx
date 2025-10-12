import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function CreateCommentForm({ postId, onCommentCreated }) {
  const [content, setContent] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return; // Prevent non-logged-in users from commenting

    fetch(`http://localhost:3000/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        author_id: user.id,
      }),
    })
    .then(() => {
      setContent('');
      onCommentCreated();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="text"
        className="flex-grow p-2 border rounded-lg text-sm"
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button type="submit" className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">
        Send
      </button>
    </form>
  );
}
export default CreateCommentForm;