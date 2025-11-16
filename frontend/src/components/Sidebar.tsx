import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Home, PlusSquare, Bell, MessageSquare, User, LogOut, Users, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
    isMinimized: boolean;
    onToggle: () => void;
}

function Sidebar({ isMinimized, onToggle }: SidebarProps) {
    const { user, logout, accounts, switchAccount, notifications } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const isExpanded = !isMinimized || isHovering;

    useEffect(() => {
        if (isMinimized) {
            setIsSwitchModalOpen(false);
        }
    }, [isMinimized]);

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
        <div
            className={`
        h-full flex flex-col justify-between text-primary-text
        transition-all duration-300 ease-in-out
        ${isMinimized && isHovering ? 'absolute w-64 p-4 bg-surface shadow-xl' : ''}
        ${isMinimized && !isHovering ? 'p-2' : 'p-4'}
      `}
            onMouseEnter={() => { if (isMinimized) setIsHovering(true); }}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="flex-shrink overflow-y-auto scrollbar-hide">
                <nav>
                    <ul>
                        {navItems.map((item) => {
                            const NavIcon = item.Icon;
                            const isActive = currentPath === item.path;
                            return (
                                <li key={item.name} className="mb-4">
                                    <button
                                        onClick={item.action}
                                        className={`
                                          flex items-center p-2 text-lg rounded-lg transition-colors duration-200 w-full
                                          ${isActive ? 'bg-accent text-white font-bold shadow-md' : 'font-semibold hover:bg-primary-border'}
                                          ${!isExpanded ? 'justify-center' : ''}
                                        `}
                                    >
                                        <NavIcon size={24} className={`flex-shrink-0 ${isExpanded ? 'mr-4' : 'mr-0'}`} />
                                        <span className={`flex-grow text-left ${!isExpanded && 'hidden'}`}>{item.name}</span>
                                        {item.badge && item.badge > 0 && (
                                            <span className={`
                                              text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center
                                              ${isActive ? 'bg-white text-accent' : 'bg-red-500'}
                                              ${!isExpanded && 'hidden'}
                                            `}>
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
            <div className="flex-shrink-0">
                <button
                    onClick={onToggle}
                    className={`
                        flex items-center p-2 text-md text-secondary-text rounded-lg hover:bg-primary-border w-full
                        transition-colors duration-200
                        ${!isExpanded ? 'justify-center' : 'mb-2'}
                    `}
                >
                    {isMinimized ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                    <span className={`ml-3 ${!isExpanded && 'hidden'}`}>
                        {isMinimized ? 'Maximize' : 'Minimize'}
                    </span>
                </button>
                <button
                    onClick={() => setIsSwitchModalOpen(true)}
                    className={`
                        w-full flex items-center text-left p-2 text-md text-secondary-text rounded-lg
                        hover:bg-primary-border transition-colors duration-200
                        ${!isExpanded ? 'justify-center' : ''}
                    `}
                >
                    <Users size={20} className={`flex-shrink-0 ${isExpanded ? 'mr-3' : 'mr-0'}`} />
                    <span className={`${!isExpanded && 'hidden'}`}>Switch Accounts</span>
                </button>
                <button
                    onClick={handleLogout}
                    className={`
                        w-full flex items-center text-left p-2 text-md text-red-500 font-semibold
                        rounded-lg hover:bg-red-500/10 transition-colors duration-200
                        ${!isExpanded ? 'justify-center' : ''}
                    `}
                >
                    <LogOut size={20} className={`flex-shrink-0 ${isExpanded ? 'mr-3' : 'mr-0'}`} />
                    <span className={`${!isExpanded && 'hidden'}`}>Log Out ({user?.username})</span>
                </button>
            </div>
            {isSwitchModalOpen && isExpanded && (
                <div className="absolute bottom-16 left-2 w-64 mb-2 p-4 bg-surface border border-primary-border rounded-lg shadow-lg z-20">
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