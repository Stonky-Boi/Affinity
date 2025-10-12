import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CreateCommentForm from './CreateCommentForm';
import { useAuth } from '../context/AuthContext';

function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const { token } = useAuth();

  const fetchComments = () => {
    if (!postId) return;
    fetch(`http://localhost:3000/posts/${postId}/comments`)
      .then(response => response.json())
      .then(data => setComments(data))
      .catch(error => console.error('Error fetching comments:', error));
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSaveComment = async (commentId, newContent) => {
    await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: newContent }),
    });
    fetchComments();
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    fetchComments();
  };

  return (
    <div>
      <CommentList
        comments={comments}
        onSaveComment={handleSaveComment}
        onDeleteComment={handleDeleteComment}
        onCommentCreated={fetchComments}
      />
      <CreateCommentForm postId={postId} onCommentCreated={fetchComments} />
    </div>
  );
}
export default CommentSection;