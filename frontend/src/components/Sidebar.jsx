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
    <div className="p-4 h-full flex flex-col justify-between">
      <div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-4">
                <Link to={item.path} className="flex items-center p-2 text-lg font-semibold rounded-lg hover:bg-gray-200">
                  <span className="mr-4">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Account Management Section */}
      <div>
        <button onClick={() => alert("Switch accounts feature coming soon!")} className="w-full text-left p-2 text-md text-gray-600 rounded-lg hover:bg-gray-200">
          Switch Accounts
        </button>
        <button onClick={handleLogout} className="w-full text-left p-2 text-md text-red-500 font-semibold rounded-lg hover:bg-red-100">
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;