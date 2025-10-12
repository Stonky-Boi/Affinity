import { useState } from 'react';
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
          <div key={post.id} className="p-4 border rounded-lg shadow-sm">
            {editingPostId === post.id ? (
              // EDITING VIEW
              <div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-2 border rounded-lg text-lg"
                />
                <div className="mt-2">
                  <button onClick={() => handleSave(post.id)} className="text-xs font-semibold text-green-600 hover:underline mr-2">Save</button>
                  <button onClick={() => setEditingPostId(null)} className="text-xs font-semibold text-gray-500 hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              // NORMAL VIEW
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-500">{post.author.username}</p>
                    <p className="mt-1 text-lg">{post.content}</p>
                  </div>
                  {user && user.id === post.author_id && (
                    <div className="flex-shrink-0 ml-4">
                      <button onClick={() => handleEdit(post)} className="text-xs font-semibold text-gray-500 hover:underline mr-2">Edit</button>
                      <button onClick={() => onDeletePost(post.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                    </div>
                  )}
                </div>
                <ReactionSection postId={post.id} />
                <div className="mt-4 border-t pt-4">
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