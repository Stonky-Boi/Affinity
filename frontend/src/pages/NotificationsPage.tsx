import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import type { FollowRequest, Notification } from '../types';
import { Bell, UserPlus, Heart, MessageCircle } from 'lucide-react';

// Helper to get an icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'NEW_FOLLOWER':
    case 'FOLLOW_ACCEPTED':
      return <UserPlus className="w-5 h-5 text-accent" />;
    case 'NEW_REACTION':
      return <Heart className="w-5 h-5 text-red-500" />;
    case 'NEW_COMMENT':
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    default:
      return <Bell className="w-5 h-5 text-secondary-text" />;
  }
};

function NotificationsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  // Get the notifications array from our context
  const { token, notifications, clearNotifications } = useAuth();

  const fetchRequests = () => {
    if (!token) return;
    fetch('/api/follows/pending', { // <-- Make sure this is a relative path
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: FollowRequest[]) => setRequests(data));
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleResponse = (followerId: string | number, newStatus: 'accepted' | 'declined') => {
    fetch('/api/follows/respond', { // <-- Make sure this is a relative path
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ follower_id: followerId, newStatus }),
    })
      .then(() => {
        fetchRequests(); // Refresh the list of requests
      });
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
      {requests.length > 0 ? (
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
    </div>
  );
}

export default NotificationsPage;