import { useState } from 'react';
import { Link } from 'react-router-dom';
import CommentSection from './CommentSection';
import ReactionSection from './ReactionSection';
import { useAuth } from '../context/AuthContext';
import type { Post, PostListProps } from '../types';
import MediaRenderer from './MediaRenderer';

function PostList({ posts, onSavePost, onDeletePost }: PostListProps) {
    const { user } = useAuth();
    const [editingPostId, setEditingPostId] = useState<string | number | null>(null);
    const [editedContent, setEditedContent] = useState('');

    const handleEdit = (post: Post) => {
        setEditingPostId(post.id);
        setEditedContent(post.content);
    };

    const handleSave = (postId: string | number) => {
        onSavePost?.(postId, editedContent);
        setEditingPostId(null);
    };

    return (
        <div className="p-8">
            <div className="space-y-6">
                {posts.map(post => {
                    const profilePic = post.author.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${post.author.username}`;
                    return (
                        <div key={post.id} className="p-4 border border-primary-border rounded-lg shadow-sm bg-surface">
                            {editingPostId === post.id ? (
                                <div>
                                    <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full p-2 border border-primary-border rounded-lg text-lg bg-background text-primary-text"
                                    />
                                    <div className="mt-2">
                                        <button onClick={() => handleSave(post.id)} className="text-xs font-semibold text-green-600 hover:underline mr-2">Save</button>
                                        <button onClick={() => setEditingPostId(null)} className="text-xs font-semibold text-secondary-text hover:underline">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <Link to={`/${post.author.username}`}>
                                        <img
                                            src={profilePic}
                                            alt={post.author.username}
                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        />
                                    </Link>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Link to={`/${post.author.username}`}>
                                                    <p className="font-semibold text-secondary-text hover:underline">{post.author.username}</p>
                                                </Link>
                                                <p className="mt-1 text-base text-primary-text">{post.content}</p>
                                            </div>
                                            {user && user.id === post.author_id && (
                                                <div className="flex-shrink-0 ml-4">
                                                    <button onClick={() => handleEdit(post)} className="text-xs font-semibold text-secondary-text hover:underline mr-2">Edit</button>
                                                    <button onClick={() => onDeletePost?.(post.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                                                </div>
                                            )}
                                        </div>
                                        {post.media_url && (
                                            <div className="mt-4">
                                                <MediaRenderer
                                                    url={post.media_url}
                                                    alt="Post media"
                                                    className="max-h-96 rounded-lg border border-primary-border"
                                                />
                                            </div>
                                        )}
                                        <ReactionSection postId={post.id} />
                                        <div className="mt-4 border-t border-primary-border pt-4">
                                            <CommentSection postId={post.id} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default PostList;