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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadController, setUploadController] = useState<AbortController | null>(null);
    const { user, token } = useAuth();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !token) {
            return;
        }
        const file = e.target.files[0];
        const controller = new AbortController();
        setUploadController(controller);
        setIsUploading(true);
        setError(null);
        setUploadProgress(0);
        try {
            const secure_url = await uploadToCloudinary(file, token, {
                onProgress: (progress) => setUploadProgress(progress),
                abortSignal: controller.signal,
            });

            setMediaUrl(secure_url);
        } catch (err: any) {
            if (err.message !== "Upload canceled.") {
                setError(err.message);
            }
        } finally {
            setIsUploading(false);
            setUploadController(null);
        }
    };

    const handleCancelUpload = () => {
        if (uploadController) {
            uploadController.abort();
            setUploadProgress(0);
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
                {isUploading && (
                    <div className="flex items-center gap-4">
                        <div className="flex-grow bg-primary-border rounded-full h-2.5">
                            <div
                                className="bg-accent h-2.5 rounded-full transition-all duration-150"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold text-primary-text">{uploadProgress}%</span>
                        <button
                            type="button"
                            onClick={handleCancelUpload}
                            className="p-1 rounded-full text-secondary-text hover:bg-red-500/10 hover:text-red-500"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-4 py-2 bg-accent text-white font-semibold rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-90 disabled:opacity-50"
                >
                    {isSubmitting ? 'Posting...' : (isUploading ? 'Waiting...' : 'Post')}
                </button>
            </form>
        </div>
    );
}

export default CreatePostForm;