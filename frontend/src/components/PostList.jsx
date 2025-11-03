import { useState } from 'react';
import { Link } from 'react-router-dom';
import CommentSection from './CommentSection';
import ReactionSection from './ReactionSection';
import { useAuth } from '../context/AuthContext';

function PostList({ posts, onSavePost, onDeletePost }) {
  const { user } = useAuth();
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  const handleEdit = (post) => {
    setEditingPostId(post.id);
    setEditedContent(post.content);
  };

  const handleSave = (postId) => {
    onSavePost(postId, editedContent);
    setEditingPostId(null);
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        {posts.map(post => (
          // Use semantic background and border for the post container
          <div key={post.id} className="p-4 border border-primary-border rounded-lg shadow-sm bg-surface">
            {editingPostId === post.id ? (
              // EDITING VIEW
              <div>
                {/* Use semantic colors for textarea */}
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-2 border border-primary-border rounded-lg text-lg bg-background text-primary-text"
                />
                <div className="mt-2">
                  {/* Keep green for save, use secondary for cancel */}
                  <button onClick={() => handleSave(post.id)} className="text-xs font-semibold text-green-600 hover:underline mr-2">Save</button>
                  <button onClick={() => setEditingPostId(null)} className="text-xs font-semibold text-secondary-text hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              // NORMAL VIEW
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/${post.author.username}`}>
                      {/* Use semantic colors for username */}
                      <p className="font-semibold text-secondary-text hover:underline">{post.author.username}</p>
                    </Link>
                    {/* Use semantic color for post content */}
                    <p className="mt-1 text-lg text-primary-text">{post.content}</p>
                  </div>
                  {user && user.id === post.author_id && (
                    <div className="flex-shrink-0 ml-4">
                      {/* Use semantic color for edit, keep red for delete */}
                      <button onClick={() => handleEdit(post)} className="text-xs font-semibold text-secondary-text hover:underline mr-2">Edit</button>
                      <button onClick={() => onDeletePost(post.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                    </div>
                  )}
                </div>
                {/* Conditionally render media if it exists */}
                {post.media_url && (
                  <div className="mt-4">
                    <img src={post.media_url} alt="Post media" className="max-h-96 w-full object-contain rounded-lg border border-primary-border" />
                  </div>
                )}
                <ReactionSection postId={post.id} />
                {/* Add border color to the divider */}
                <div className="mt-4 border-t border-primary-border pt-4">
                  <CommentSection postId={post.id} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostList;