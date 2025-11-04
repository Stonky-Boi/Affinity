import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreateCommentForm from './CreateCommentForm';
import type { CommentProps } from '../types';

function Comment({
  comment,
  postId,
  onSaveComment,
  onDeleteComment,
  onCommentCreated
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const { user } = useAuth();

  const handleSave = () => {
    onSaveComment(comment.id, editedContent);
    setIsEditing(false);
  };

  return (
    <div className="ml-4 pl-4 border-l border-primary-border">
      <div className="text-sm p-2 bg-background rounded-lg">
        {isEditing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-1 border border-primary-border rounded text-sm bg-surface text-primary-text"
            />
            <div className="mt-1">
              <button onClick={handleSave} className="text-xs font-semibold text-green-600 hover:underline mr-2">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-xs font-semibold text-secondary-text hover:underline">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <Link to={`/${comment.author.username}`}>
              <p className="font-semibold text-secondary-text hover:underline">{comment.author.username}</p>
            </Link>
            <p className="text-primary-text">{comment.content}</p>
            <div className="mt-1 flex items-center gap-4">
              <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-semibold text-secondary-text hover:underline">Reply</button>
              {user && user.id === comment.author.id && (
                <>
                  <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-secondary-text hover:underline">Edit</button>
                  <button onClick={() => onDeleteComment(comment.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {isReplying && (
        <div className="mt-2">
          <CreateCommentForm postId={postId} parentId={comment.id} onCommentCreated={() => { setIsReplying(false); onCommentCreated(); }} />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              onSaveComment={onSaveComment}
              onDeleteComment={onDeleteComment}
              onCommentCreated={onCommentCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default Comment;