import { ReactNode } from 'react';
import { Socket } from 'socket.io-client';

export interface User {
    id: number;
    username: string;
    email?: string;
    picture_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    bio?: string | null;
    date_of_birth?: string | null;
    phone?: string | null;
    alternate_email?: string | null;
    created_at?: string;
    settings?: { is_private?: boolean };
    privacy_settings?: any;
    participants?: Participant[];
}

export interface UserProfile extends User {
    posts: Post[];
    is_private?: boolean;
}

export interface MutualUser extends User {
    score: number;
}

export interface UserCardProps {
    user: User;
}

export interface Account {
    user: User;
    token: string;
}

export interface AuthContextType {
    token: string | null;
    user: User | null;
    accounts: Account[];
    login: (userData: User, userToken: string) => void;
    signup: (username: string, email: string, password: string) => Promise<void>;
    logout: (userIdToLogout?: number) => void;
    switchAccount: (userIdToSwitchTo: number) => void;
    socket: AppSocket | null;
    notifications: Notification[];
    clearNotifications: () => void;
}

export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

export interface Post {
    id: number | string;
    content: string;
    author_id: number | string;
    author: User;
    media_url?: string | null;
    created_at?: string;
}

export interface CreatePostFormProps {
    onPostCreated: () => void;
}

export interface PostListProps {
    posts: Post[];
    onSavePost?: (postId: number | string, newContent: string) => Promise<void>;
    onDeletePost?: (postId: number | string) => Promise<void>;
}

export interface Comment {
    id: number | string;
    content: string;
    author: User;
    replies?: Comment[];
}

export interface CreateCommentFormProps {
    postId: number | string;
    parentId?: number | string | null;
    onCommentCreated: () => void;
}

export interface CommentProps {
    comment: Comment;
    postId: number | string;
    onSaveComment: (commentId: number | string, content: string) => void;
    onDeleteComment: (commentId: number | string) => void;
    onCommentCreated: () => void;
}

export interface CommentSectionProps {
    postId: number | string;
}

export interface CommentListProps {
    comments: Comment[];
    postId: number | string;
    onSaveComment: (commentId: number | string, content: string) => void;
    onDeleteComment: (commentId: number | string) => void;
    onCommentCreated: () => void;
}

export interface MessageSender {
    id: number | string;
    username: string;
    picture_url?: string | null;
}

export interface Message {
    id: number | string;
    content: string;
    sender_id: number | string;
    conversation_id: number | string;
    sender?: MessageSender;
    deleted_at?: string | null;
}

export interface MessagePreview {
    id: number | string;
    content: string;
    deleted_at?: string | null;
    sender?: {
        id: number | string;
        username?: string;
    };
}

export interface Conversation {
    id: number | string;
    name?: string | null;
    picture_url?: string | null;
    type?: "DIRECT" | "GROUP";
    participants: Participant[];
    messages: MessagePreview[];
}

export interface ConversationListProps {
    onSelectConversation: (conversationId: number | string) => void;
    refreshKey?: number;
}

export interface Participant {
    user_id: number;
    conversation_id: number;
    role: Role;
    user: User;
}

export interface ChatWindowProps {
    conversationId: string;
    onClose: () => void;
}

export interface NewMessageData {
    content: string;
    sender_id: number | string;
    conversation_id: string;
}

export interface FollowData {
    follower_id?: number;
    following_id: number;
    follower?: User;
    following?: User;
    status: string;
}

export interface FollowRequest {
    follower_id: number | string;
    follower: User;
}

export interface Reaction {
    id: number | string;
    user_id: number | string;
    reaction_type: ReactionKey;
}

export interface ReactionSectionProps {
    postId: number | string;
}

export interface ApiError {
    error: string;
}

export interface Notification {
    message: string;
    type: string;
    timestamp: Date;
}

export interface ServerToClientEvents {
    receive_message: (message: Message) => void;
    receive_notification: (notification: { message: string, type: string }) => void;
}

export interface ClientToServerEvents {
    authenticate: (token: string) => void;
    join_conversation: (conversationId: string) => void;
    send_message: (messageData: NewMessageData) => void;
}

export interface ProviderProps {
    children: ReactNode;
}

export interface ProtectedRouteProps {
    children: ReactNode;
}

export type Role = "MEMBER" | "ADMIN";
export type FeedType = 'algorithmic' | 'chronological';
export type ProfilePageView = 'edit' | 'followers' | 'following';
export type PublicProfilePageView = 'posts' | 'mutuals' | 'followers' | 'following';
export type ReactionKey = 'like' | 'love' | 'laugh' | 'dislike' | 'angry' | 'party' | 'star' | 'smile' | 'annoyed' | 'strong' | 'frown' | 'fist' | 'help' | 'metal' | 'broken' | 'care' | 'healthy' | 'meh' | 'celebrate' | 'salad';
export type UserProfileResponse = UserProfile | ApiError;
export type Theme = 'light' | 'dark';
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;