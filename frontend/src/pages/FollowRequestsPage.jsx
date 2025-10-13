import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';

function FollowRequestsPage() {
  const [requests, setRequests] = useState([]);
  const { token } = useAuth();

  const fetchRequests = () => {
    if (!token) return;
    fetch('http://localhost:3000/follows/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setRequests(data));
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleResponse = (followerId, newStatus) => {
    fetch('http://localhost:3000/follows/respond', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ follower_id: followerId, newStatus }),
    })
    .then(() => {
      fetchRequests(); // Refresh the list after responding
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Follow Requests</h1>
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.follower_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <UserCard user={req.follower} />
              <div className="flex gap-2">
                <button onClick={() => handleResponse(req.follower_id, 'accepted')} className="bg-blue-500 text-white font-semibold px-4 py-1 rounded-lg">Accept</button>
                <button onClick={() => handleResponse(req.follower_id, 'declined')} className="bg-gray-300 font-semibold px-4 py-1 rounded-lg">Decline</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>You have no pending follow requests.</p>
      )}
    </div>
  );
}

export default FollowRequestsPage;