import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreateCommentForm from './CreateCommentForm';

function Comment({ comment, postId, onSaveComment, onDeleteComment, onCommentCreated }) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const { user } = useAuth();

  const handleSave = () => {
    onSaveComment(comment.id, editedContent);
    setIsEditing(false);
  };

  return (
    // Use semantic border color for the left border
    <div className="ml-4 pl-4 border-l border-primary-border">
      {/* Use semantic background for the comment bubble */}
      <div className="text-sm p-2 bg-background rounded-lg">
        {isEditing ? (
          <div>
            {/* Use semantic colors for the edit textarea */}
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-1 border border-primary-border rounded text-sm bg-surface text-primary-text"
            />
            <div className="mt-1">
              {/* Keep green for Save, use secondary for Cancel */}
              <button onClick={handleSave} className="text-xs font-semibold text-green-600 hover:underline mr-2">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-xs font-semibold text-secondary-text hover:underline">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <Link to={`/${comment.author.username}`}>
              {/* Use semantic color for username */}
              <p className="font-semibold text-secondary-text hover:underline">{comment.author.username}</p>
            </Link>
            {/* Use semantic color for comment content */}
            <p className="text-primary-text">{comment.content}</p>
            <div className="mt-1 flex items-center gap-4">
              {/* Use semantic color for action buttons */}
              <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-semibold text-secondary-text hover:underline">Reply</button>
              {user && user.id === comment.author.id && (
                <>
                  <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-secondary-text hover:underline">Edit</button>
                  {/* Keep red for Delete */}
                  <button onClick={() => onDeleteComment(comment.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reply form section - no style changes needed here */}
      {isReplying && (
        <div className="mt-2">
          <CreateCommentForm postId={postId} parentId={comment.id} onCommentCreated={() => { setIsReplying(false); onCommentCreated(); }} />
        </div>
      )}

      {/* Recursive replies section - no style changes needed here */}
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