import CommentList from './CommentList';
import CreateCommentForm from './CreateCommentForm';
import { useAuth } from '../context/AuthContext';
import type { Comment, CommentSectionProps } from '../types';
import { useApi } from '../hooks/useApi';
import { SkeletonLoader } from './SkeletonLoader';

function CommentSection({ postId }: CommentSectionProps) {
    const { token } = useAuth();
    const { data: comments, isLoading, error, refresh: fetchComments } = useApi<Comment[]>(
        `/api/comments/post/${postId}`
    );

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
                    comments={comments || []}
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