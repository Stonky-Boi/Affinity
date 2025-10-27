import { useState, useEffect } from 'react';
import PostList from '../components/PostList';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const { token } = useAuth();
  const fetchPosts = () => {
    if (!token) return;
    // Fetch from the personalized /feed endpoint
    fetch('http://localhost:3000/feed', {
      headers: {
        'Authorization': `Bearer ${token}`, // Add the auth header
      },
    })
      .then(response => response.json())
      .then(data => setPosts(data)) // Sorting is done on backend
      .catch(error => console.error('Error fetching feed:', error));
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

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
      <PostList posts={posts} onSavePost={handleSavePost} onDeletePost={handleDeletePost} />
    </div>
  );
}

export default HomePage;