import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users from your backend API
    fetch('http://localhost:3000/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  return (
    <div className="p-8">
      {/* Use semantic text color */}
      <h1 className="text-2xl font-bold mb-4 text-primary-text">Users</h1>
      <ul className="list-disc pl-5">
        {users.map(user => (
          <li key={user.id} className="mb-2">
            {/* Use semantic text colors */}
            <p className="font-semibold text-primary-text">{user.username}</p>
            <p className="text-secondary-text">{user.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;