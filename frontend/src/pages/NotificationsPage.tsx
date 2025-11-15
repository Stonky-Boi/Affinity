import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import type { FollowRequest, Notification, User } from '../types';
import { Bell, UserPlus, Heart, MessageCircle, MessageSquare } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useApi } from '../hooks/useApi';

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'NEW_FOLLOWER':
        case 'FOLLOW_ACCEPTED':
            return <UserPlus className="w-5 h-5 text-accent" />;
        case 'NEW_REACTION':
            return <Heart className="w-5 h-5 text-red-500" />;
        case 'NEW_COMMENT':
            return <MessageCircle className="w-5 h-5 text-blue-500" />;
        case 'NEW_REPLY':
            return <MessageSquare className="w-5 h-5 text-green-500" />;
        default:
            return <Bell className="w-5 h-5 text-secondary-text" />;
    }
};

function NotificationsPage() {
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [acceptedRequests, setAcceptedRequests] = useState<FollowRequest[]>([]);
    const { token, notifications, clearNotifications } = useAuth();
    const { data: initialRequests, isLoading, error, refresh: fetchRequests } = useApi<FollowRequest[]>(
        token ? '/api/follows/pending' : null
    );

    useEffect(() => {
        if (initialRequests) {
            setRequests(initialRequests);
        }
    }, [initialRequests]);

    const handleResponse = (followerId: string | number, newStatus: 'accepted' | 'declined') => {
        fetch('/api/follows/respond', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ follower_id: followerId, newStatus }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to respond to request.');
                const processedRequest = requests.find(r => r.follower_id === followerId);
                if (processedRequest) {
                    if (newStatus === 'accepted') {
                        setAcceptedRequests(prev => [...prev, processedRequest]);
                    }
                    setRequests(prev => prev.filter(r => r.follower_id !== followerId));
                }
            })
            .catch(err => {
                console.error("Error in handleResponse:", err);
                alert(err.message);
                fetchRequests();
            });
    };

    const handleFollowBack = (userToFollow: User) => {
        if (!token) return;
        fetch(`/api/follows/user/${userToFollow.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to follow back.');
                handleDismissFollowBack(userToFollow.id);
            })
            .catch(err => alert(`Could not follow back: ${err.message}`));
    };

    const handleDismissFollowBack = (followerId: string | number) => {
        setAcceptedRequests(prev => prev.filter(r => r.follower_id !== followerId));
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-primary-text">Recent Notifications</h1>
                {notifications.length > 0 && (
                    <button
                        onClick={clearNotifications}
                        className="text-sm font-semibold text-accent hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>
            <div className="space-y-4 mb-10">
                {notifications.length > 0 ? (
                    notifications.map((notif: Notification, index: number) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-surface border border-primary-border rounded-lg">
                            <div className="flex-shrink-0">
                                {getNotificationIcon(notif.type)}
                            </div>
                            <p className="text-primary-text">{notif.message}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-secondary-text">You have no new notifications.</p>
                )}
            </div>
            <h2 className="text-2xl font-bold mb-6 text-primary-text">Pending Follow Requests</h2>
            {isLoading ? (
                <div className="space-y-4">
                    <SkeletonLoader className="h-20 w-full" />
                </div>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : requests.length > 0 ? (
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req.follower_id} className="flex items-center justify-between p-2 bg-surface border border-primary-border rounded-lg">
                            <UserCard user={req.follower} />
                            <div className="flex gap-2">
                                <button onClick={() => handleResponse(req.follower_id, 'accepted')} className="bg-accent text-white font-semibold px-4 py-1 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-90">Accept</button>
                                <button onClick={() => handleResponse(req.follower_id, 'declined')} className="bg-primary-border text-primary-text font-semibold px-4 py-1 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:brightness-95">Decline</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-secondary-text">You have no pending follow requests.</p>
            )}
            {acceptedRequests.length > 0 && (
                <div className="space-y-4 mt-4">
                    {acceptedRequests.map(req => (
                        <div key={req.follower_id} className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex-grow">
                                <UserCard user={req.follower} />
                                <p className="text-sm text-green-700 dark:text-green-300 ml-2">You accepted {req.follower.username}'s request.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleFollowBack(req.follower)} className="bg-accent text-white font-semibold px-4 py-1 rounded-lg hover:brightness-90">Follow Back</button>
                                <button onClick={() => handleDismissFollowBack(req.follower_id)} className="bg-primary-border text-primary-text font-semibold px-4 py-1 rounded-lg hover:brightness-95">Dismiss</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NotificationsPage;