import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { CreatePostFormProps } from '../types';

function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: content,
                    media_url: mediaUrl || null
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create post.');
            }
            setContent('');
            setMediaUrl('');
            onPostCreated();
        } catch (err: any) {
            console.error("Error creating post:", err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 border-t border-primary-border">
            <h2 className="text-xl font-bold mb-4 text-primary-text">Create a New Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text"
                    rows={4}
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                ></textarea>
                <input
                    type="text"
                    className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text placeholder-secondary-text"
                    placeholder="Image URL (optional)"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                />
                {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-accent text-white font-semibold rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-90" // Added transition, scale
                >
                    {isSubmitting ? 'Posting...' : 'Post'}
                </button>
            </form>
        </div>
    );
}

export default CreatePostForm;