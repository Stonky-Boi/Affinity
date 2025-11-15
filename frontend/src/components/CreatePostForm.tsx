import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { CreatePostFormProps } from '../types';
import { uploadToCloudinary } from '../utils/upload';
import { X } from 'lucide-react';
import MediaRenderer from './MediaRenderer';

function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, token } = useAuth();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !token) {
            return;
        }
        const file = e.target.files[0];
        setIsUploading(true);
        setError(null);

        try {
            const secure_url = await uploadToCloudinary(file, token);
            setMediaUrl(secure_url);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

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
                {mediaUrl ? (
                    <div className="relative">
                        <MediaRenderer
                            url={mediaUrl}
                            alt="Upload preview"
                            className="max-h-96 rounded-lg border border-primary-border"
                        />
                        <button
                            type="button"
                            onClick={() => setMediaUrl('')}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/75"
                            aria-label="Remove image"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="w-full p-2 border border-primary-border rounded-lg bg-background">
                        <input
                            type="file"
                            accept="image/*,video/*,audio/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="text-sm text-secondary-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-border file:text-primary-text hover:file:brightness-90"
                        />
                    </div>
                )}
                {isUploading && <p className="text-accent text-sm">Uploading media...</p>}
                {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-4 py-2 bg-accent text-white font-semibold rounded-lg ... "
                >
                    {isSubmitting ? 'Posting...' : (isUploading ? 'Waiting...' : 'Post')}
                </button>
            </form>
        </div>
    );
}

export default CreatePostForm;