import Comment from './Comment';

function CommentList({ comments, onSaveComment, onDeleteComment, onCommentCreated }) {
  return (
    <div className="mt-4 space-y-4">
      {comments.map(comment => (
        <Comment
          key={comment.id}
          comment={comment}
          onSaveComment={onSaveComment}
          onDeleteComment={onDeleteComment}
          onCommentCreated={onCommentCreated}
        />
      ))}
    </div>
  );
}

export default CommentList;