import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CreateCommentForm from './CreateCommentForm';
import { useAuth } from '../context/AuthContext';
import type { Comment, CommentSectionProps } from '../types';
import { SkeletonLoader } from './SkeletonLoader';

function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchComments = () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    fetch(`/api/comments/post/${postId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load comments.');
        return res.json();
      })
      .then((data: Comment[]) => setComments(data))
      .catch(error => {
        console.error('Error fetching comments:', error);
        setError(error.message);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSaveComment = async (commentId: string | number, newContent: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) throw new Error('Failed to save edit.');
      fetchComments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete comment.');
      fetchComments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="space-y-4 mt-4">
          <SkeletonLoader className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="mt-4 text-red-500">{error}</p>
      ) : (
        <CommentList
          comments={comments}
          postId={postId}
          onSaveComment={handleSaveComment}
          onDeleteComment={handleDeleteComment}
          onCommentCreated={fetchComments}
        />
      )}
      <CreateCommentForm postId={postId} onCommentCreated={fetchComments} />
    </div>
  );
}
export default CommentSection;