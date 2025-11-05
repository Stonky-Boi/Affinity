import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import PostList from '../components/PostList';
import { useAuth } from '../context/AuthContext';
import { PostSkeleton } from '../components/SkeletonLoader';
import type { Post, UserProfile } from '../types';

function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const searchUser = searchParams.get('searchUser');
  const location = useLocation();

  const fetchPosts = () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    const url = searchUser
      ? `/api/users/${searchUser}`
      : `/api/posts/feed`;
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch data.');
        }
        return response.json();
      })
      .then((data: UserProfile | Post[]) => {
        if (searchUser) {
          setPosts((data as UserProfile).posts || []);
        } else {
          setPosts((data as Post[]) || []);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
        setError(error.message || 'An unknown error occurred. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [token, searchUser, location.pathname]);

  const handleDeletePost = async (postId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchPosts();
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
      fetchPosts();
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  return (
    <div>
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
        !error && <PostList posts={posts} onSavePost={handleSavePost} onDeletePost={handleDeletePost} />
      )}
      {searchUser && posts.length === 0 && !isLoading && (
        <p className="p-8 text-secondary-text">{searchUser} hasn't posted anything yet.</p>
      )}
    </div>
  );
}

export default HomePage;