import { useState } from 'react';
import PostList from '../components/PostList';
import { useAuth } from '../context/AuthContext';
import { PostSkeleton } from '../components/SkeletonLoader';
import type { Post, FeedType } from '../types';
import { useApi } from '../hooks/useApi';

function HomePage() {
    const { token } = useAuth();
    const [feedType, setFeedType] = useState<FeedType>('algorithmic');
    const { data: posts, isLoading, error, refresh } = useApi<Post[]>(
        `/api/posts/feed?sort=${feedType}`
    );

    const handleDeletePost = async (postId: string | number) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            refresh();
        } catch (error) {
            console.error("Failed to delete post:", error);
        }
    };

    const handleSavePost = async (postId: string | number, newContent: string) => {
        try {
            await fetch(`/api/posts/${postId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: newContent }),
            });
            refresh();
        } catch (error) {
            console.error("Failed to save post:", error);
        }
    };

    const getTabClass = (type: FeedType) => {
        return `w-1/2 py-3 text-center font-semibold transition-colors ${feedType === type
            ? 'text-accent border-b-2 border-accent'
            : 'text-secondary-text hover:bg-primary-border/50'
            }`;
    };

    return (
        <div>
            <div className="flex border-b border-primary-border bg-surface">
                <button
                    onClick={() => setFeedType('algorithmic')}
                    className={getTabClass('algorithmic')}
                >
                    For You
                </button>
                <button
                    onClick={() => setFeedType('chronological')}
                    className={getTabClass('chronological')}
                >
                    Following
                </button>
            </div>
            {error && (
                <div className="p-8 text-center">
                    <p className="p-4 bg-red-500/10 text-red-500 border border-red-500 rounded-lg">{error}</p>
                </div>
            )}
            {isLoading ? (
                <div className="p-8 space-y-6">
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            ) : (
                !error && <PostList posts={posts || []} onSavePost={handleSavePost} onDeletePost={handleDeletePost} />
            )}
            {posts && posts.length === 0 && !isLoading && (
                <p className="p-8 text-secondary-text">No posts found.</p>
            )}
        </div>
    );
}

export default HomePage;