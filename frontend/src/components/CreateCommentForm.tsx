import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { CreateCommentFormProps } from '../types';

function CreateCommentForm({ postId, parentId = null, onCommentCreated }: CreateCommentFormProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || content.trim() === '') return;
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`/api/comments/post/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content,
                    parent_id: parentId,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to post comment');
            }
            setContent('');
            onCommentCreated();
        } catch (err: any) {
            console.error("Error creating comment:", err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2">
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
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary-border text-primary-text rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out hover:brightness-95 disabled:opacity-50"
                >
                    {isSubmitting ? '...' : 'Send'}
                </button>
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </form>
    );
}

export default CreateCommentForm;