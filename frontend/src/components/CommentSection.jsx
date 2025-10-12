import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CreateCommentForm from './CreateCommentForm';

function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);

  const fetchComments = () => {
    if (!postId) return;
    fetch(`http://localhost:3000/posts/${postId}/comments`)
      .then(response => response.json())
      .then(data => setComments(data))
      .catch(error => console.error('Error fetching comments:', error));
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (
    <div>
      <CommentList comments={comments} />
      <CreateCommentForm postId={postId} onCommentCreated={fetchComments} />
    </div>
  );
}

export default CommentSection;