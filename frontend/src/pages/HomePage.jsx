import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PostList from '../components/PostList';
import CreatePostForm from '../components/CreatePostForm';
import RightPanel from '../components/RightPanel';

function HomePage() {
  const [posts, setPosts] = useState([]);

  const fetchPosts = () => {
    fetch('http://localhost:3000/posts')
      .then(response => response.json())
      .then(data => setPosts(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))))
      .catch(error => console.error('Error fetching posts:', error));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <div className="w-1/5 border-r"><Sidebar /></div>
      <main className="w-3/5 overflow-y-auto">
        <CreatePostForm onPostCreated={fetchPosts} />
        <PostList posts={posts} />
      </main>
      <div className="w-1/5 border-l"><RightPanel /></div>
    </div>
  );
}
export default HomePage;