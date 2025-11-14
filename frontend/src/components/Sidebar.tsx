import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Home, PlusSquare, Bell, MessageSquare, User, LogOut, Users } from 'lucide-react';
import { useState } from 'react';

function Sidebar() {
  const { user, logout, accounts, switchAccount, notifications } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleLogout = () => {
    logout();
  };

  const handleSwitch = (userId: number) => {
    switchAccount(userId);
    setIsSwitchModalOpen(false);
    navigate('/');
  };

  const navItems = [
    { Icon: Home, name: 'Home', path: '/', action: () => handleNavigate('/') },
    { Icon: PlusSquare, name: 'Create Post', path: '/create', action: () => handleNavigate('/create') },
    { Icon: Bell, name: 'Notifications', path: '/notifications', action: handleNotificationsClick, badge: notifications.length },
    { Icon: MessageSquare, name: 'Conversations', path: '/conversations', action: () => handleNavigate('/conversations') },
    { Icon: User, name: 'My Profile', path: `/${user?.username}`, action: () => handleNavigate(`/${user?.username}`) },
  ];

  return (
    <div className="p-4 h-full flex flex-col justify-between text-primary-text relative">
      <div>
        <nav>
          <ul>
            {navItems.map((item) => {
              const NavIcon = item.Icon;
              const isActive = currentPath === item.path;
              return (
                <li key={item.name} className="mb-4">
                  <button
                    onClick={item.action}
                    className={`flex items-center p-2 text-lg rounded-lg transition-colors duration-200 w-full ${isActive
                      ? 'bg-accent text-white font-bold shadow-md'
                      : 'font-semibold hover:bg-primary-border'
                      }`}
                  >
                    <NavIcon size={24} className="mr-4 flex-shrink-0" />
                    <span className="flex-grow text-left">{item.name}</span>

                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div>
        <button onClick={() => setIsSwitchModalOpen(true)} className="w-full flex items-center text-left p-2 text-md text-secondary-text rounded-lg hover:bg-primary-border transition-colors duration-200">
          <Users size={20} className="mr-3" />
          Switch Accounts
        </button>
        <button onClick={handleLogout} className="w-full flex items-center text-left p-2 text-md text-red-500 font-semibold rounded-lg hover:bg-red-500/10 transition-colors duration-200">
          <LogOut size={20} className="mr-3" />
          Log Out ({user?.username})
        </button>
      </div>
      {isSwitchModalOpen && (
        <div className="absolute bottom-16 left-2 right-2 mb-2 p-4 bg-surface border border-primary-border rounded-lg shadow-lg z-20">
          <h3 className="font-semibold mb-2 text-primary-text">Switch Account</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {accounts.map(acc => {
              const profilePic = acc.user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${acc.user.username}`;
              const isActive = acc.user.id === user?.id;
              return (
                <div
                  key={acc.user.id}
                  onClick={() => handleSwitch(acc.user.id)}
                  className={`flex items-center p-2 rounded cursor-pointer ${isActive ? 'bg-accent/10' : 'hover:bg-primary-border'}`}
                >
                  <img src={profilePic} alt={acc.user.username} className="w-8 h-8 rounded-full mr-2" />
                  <span className={`text-sm ${isActive ? 'font-bold text-primary-text' : 'text-secondary-text'}`}>{acc.user.username}</span>
                  {isActive && <span className="ml-auto text-xs text-accent">(Active)</span>}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => { setIsSwitchModalOpen(false); navigate('/login'); }}
            className="mt-3 w-full text-center text-sm text-accent font-semibold hover:underline"
          >
            + Log in to another account
          </button>
          <button onClick={() => setIsSwitchModalOpen(false)} className="absolute top-2 right-2 text-secondary-text hover:text-primary-text z-30">✕</button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;