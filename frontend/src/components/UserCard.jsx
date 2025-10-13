import { Link } from 'react-router-dom';

function UserCard({ user }) {
  const profilePic = user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`;

  return (
    <Link to={`/${user.username}`} className="flex items-center p-2 rounded-lg hover:bg-gray-100">
      <img src={profilePic} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
      <div className="ml-4">
        <p className="font-semibold">{user.username}</p>
        {user.first_name && <p className="text-sm text-gray-500">{user.first_name} {user.last_name}</p>}
      </div>
    </Link>
  );
}

export default UserCard;