function CommentList({ comments }) {
  return (
    <div className="mt-4 space-y-2">
      {comments.map(comment => (
        <div key={comment.id} className="text-sm p-2 bg-gray-100 rounded-lg">
          <p className="font-semibold text-gray-600">{comment.author.username}</p>
          <p>{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
export default CommentList;