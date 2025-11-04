import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { CreateCommentFormProps } from '../types';

function CreateCommentForm({ postId, parentId = null, onCommentCreated }: CreateCommentFormProps) {
  const [content, setContent] = useState('');
  const { user, token } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    fetch(`/api/comments/post/${postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content,
        parent_id: parentId,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to post comment');
        }
        return response.json();
      })
      .then(() => {
        setContent('');
        onCommentCreated();
      })
      .catch(error => {
        console.error("Error creating comment:", error);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="text"
        className="flex-grow p-2 border border-primary-border rounded-lg text-sm bg-background text-primary-text placeholder-secondary-text"
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button
        type="submit"
        className="px-4 py-2 bg-primary-border text-primary-text rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-95" // Added transition, scale
      >
        Send
      </button>
    </form>
  );
}

export default CreateCommentForm;