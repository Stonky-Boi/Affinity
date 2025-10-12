import CommentSection from './CommentSection';
import ReactionSection from './ReactionSection'; // 1. Import ReactionSection

function PostList({ posts }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="p-4 border rounded-lg shadow-sm">
            {/* Post content */}
            <p className="font-semibold text-gray-500">{post.author.username}</p>
            <p className="mt-1 text-lg">{post.content}</p>

            {/* Reactions */}
            <ReactionSection postId={post.id} /> {/* 2. Add the ReactionSection here */}

            {/* Comment Section */}
            <div className="mt-4 border-t pt-4">
              <CommentSection postId={post.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostList;