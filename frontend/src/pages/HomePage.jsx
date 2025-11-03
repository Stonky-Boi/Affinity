import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PostList from '../components/PostList';
import { useAuth } from '../context/AuthContext';
import { PostSkeleton } from '../components/SkeletonLoader';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const searchUser = searchParams.get('searchUser');

  const fetchPosts = () => {
    if (!token) return;
    setIsLoading(true);

    // 4. Determine the correct API endpoint based on URL param
    const url = searchUser
      ? `http://localhost:3000/users/${searchUser}` // Fetch specific user's profile/posts
      : `http://localhost:3000/feed`;            // Fetch personalized feed

    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(response => response.json())
      .then(data => {
        if (searchUser) {
          // If fetching a profile, the posts are nested inside the data
          setPosts(data.posts || []);
        } else {
          // If fetching the feed, the data is the array of posts
          setPosts(data || []);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
        setIsLoading(false);
      });
  };

  // 5. Re-fetch posts when the searchUser param changes
  useEffect(() => {
    fetchPosts();
  }, [token, searchUser]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await fetch(`http://localhost:3000/posts/${postId}`, {
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

  const handleSavePost = async (postId, newContent) => {
    try {
      await fetch(`http://localhost:3000/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });
      fetchPosts(); // Refresh the post list
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  return (
    <div>
      {isLoading ? (
        // 2. Show multiple skeletons while loading
        <div className="p-8 space-y-6">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : (
        <PostList posts={posts} onSavePost={handleSavePost} onDeletePost={handleDeletePost} />
      )}
      {searchUser && posts.length === 0 && !isLoading && (
          <p className="p-8 text-secondary-text">{searchUser} hasn't posted anything yet.</p>
      )}
    </div>
  );
}

export default HomePage;