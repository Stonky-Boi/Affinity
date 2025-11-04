import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CreateCommentForm from './CreateCommentForm';
import { useAuth } from '../context/AuthContext';
import type { Comment, CommentSectionProps } from '../types';

function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const { token } = useAuth();

  const fetchComments = () => {
    if (!postId) return;
    fetch(`/api/comments/post/${postId}`)
      .then(response => response.json())
      .then((data: Comment[]) => setComments(data))
      .catch(error => console.error('Error fetching comments:', error));
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSaveComment = async (commentId: string | number, newContent: string) => {
    await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: newContent }),
    });
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string | number) => {
    if (!window.confirm("Delete this comment?")) return;
    await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    fetchComments();
  };

  return (
    <div>
      <CommentList
        comments={comments}
        postId={postId}
        onSaveComment={handleSaveComment}
        onDeleteComment={handleDeleteComment}
        onCommentCreated={fetchComments}
      />
      <CreateCommentForm postId={postId} onCommentCreated={fetchComments} />
    </div>
  );
}
export default CommentSection;