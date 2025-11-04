import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import type { FollowRequest } from '../types';

function FollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const { token } = useAuth();

  const fetchRequests = () => {
    if (!token) return;
    fetch('/api/follows/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: FollowRequest[]) => setRequests(data));
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleResponse = (followerId: string | number, newStatus: 'accepted' | 'declined') => {
    fetch('/api/follows/respond', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ follower_id: followerId, newStatus }),
    })
      .then(() => {
        fetchRequests();
      });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-primary-text">Follow Requests</h1>
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

export default FollowRequestsPage;