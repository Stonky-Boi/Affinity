import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: '🏠', name: 'Home', path: '/' },
    { icon: '➕', name: 'Create Post', path: '/create' },
    { icon: '🔔', name: 'Requests', path: '/requests' },
    { icon: '✉️', name: 'Conversations', path: '/conversations' },
    { icon: '👤', name: 'My Profile', path: '/profile' },
  ];

  return (
    // Added text-primary-text for default text color
    <div className="p-4 h-full flex flex-col justify-between text-primary-text">
      <div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-4">
                {/* Updated hover background and text color */}
                <Link to={item.path} className="flex items-center p-2 text-lg font-semibold rounded-lg hover:bg-primary-border">
                  <span className="mr-4">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Account Management Section - Updated text and hover colors */}
      <div>
        <button onClick={() => alert("Switch accounts feature coming soon!")} className="w-full text-left p-2 text-md text-secondary-text rounded-lg hover:bg-primary-border">
          Switch Accounts
        </button>
        {/* Kept red for emphasis, but updated hover background */}
        <button onClick={handleLogout} className="w-full text-left p-2 text-md text-red-500 font-semibold rounded-lg hover:bg-red-500/10"> {/* Using opacity modifier for hover */}
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;