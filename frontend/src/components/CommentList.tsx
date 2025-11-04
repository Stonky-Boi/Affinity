import Comment from './Comment';
import type { CommentListProps } from '../types';

function CommentList({ comments, postId, onSaveComment, onDeleteComment, onCommentCreated }: CommentListProps) {
  return (
    <div className="mt-4 space-y-4">
      {comments.map(comment => (
        <Comment
          key={comment.id}
          comment={comment}
          postId={postId}
          onSaveComment={onSaveComment}
          onDeleteComment={onDeleteComment}
          onCommentCreated={onCommentCreated}
        />
      ))}
    </div>
  );
}

export default CommentList;