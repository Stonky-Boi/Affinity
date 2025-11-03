import { Link } from 'react-router-dom';

function UserCard({ user }) {
  const profilePic = user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`;

  return (
    // Use semantic hover background
    <Link to={`/${user.username}`} className="flex items-center p-2 rounded-lg hover:bg-primary-border">
      <img src={profilePic} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
      <div className="ml-4">
        {/* Use semantic text colors */}
        <p className="font-semibold text-primary-text">{user.username}</p>
        {user.first_name && <p className="text-sm text-secondary-text">{user.first_name} {user.last_name}</p>}
      </div>
    </Link>
  );
}

export default UserCard;