import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function CreatePostForm({ onPostCreated }) { // Receive onPostCreated as a prop
  const [content, setContent] = useState('');
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
      }),
    })
    .then(response => response.json())
    .then(newPost => {
      console.log('New post created:', newPost);
      setContent('');
      onPostCreated();
    });
  };

  return (
    <div className="p-8 border-t">
      <h2 className="text-xl font-bold mb-4">Create a New Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-2 border rounded-lg"
          rows="3"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Post
        </button>
      </form>
    </div>
  );
}

export default CreatePostForm;