import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function CreatePostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState(''); // Ensure this state is present from previous steps
  const { user, token } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;

    fetch('http://localhost:3000/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: content,
        media_url: mediaUrl // Ensure media_url is included
      }),
    })
    .then(response => response.json())
    .then(newPost => {
      setContent('');
      setMediaUrl(''); // Clear mediaUrl state
      onPostCreated();
    });
  };

  return (
    // Use semantic border for the top border
    <div className="p-8 border-t border-primary-border">
      {/* Use semantic text color for the heading */}
      <h2 className="text-xl font-bold mb-4 text-primary-text">Create a New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Use semantic classes for the textarea */}
        <textarea
          className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text"
          rows="4" // Adjusted rows for better spacing
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
        {/* Use semantic classes for the media URL input */}
        <input
          type="text"
          className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text"
          placeholder="Image URL (optional)"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
        />
        {/* Use semantic classes for the button */}
        <button
          type="submit"
          // Use accent color for the main action button
          className="px-4 py-2 bg-accent text-white font-semibold rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-90" // Added transition, scale
        >
          Post
        </button>
      </form>
    </div>
  );
}

export default CreatePostForm;