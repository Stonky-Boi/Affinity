import { Link, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import RightPanel from './RightPanel.tsx';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { Sun, Moon } from 'lucide-react';

function MainLayout() {
    const { user } = useAuth();
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const toggleSidebar = () => setIsSidebarMinimized(prev => !prev);
    const { theme, toggleTheme } = useTheme();

    const profilePic = user?.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username}`;

    return (
        <div>
            {user && (
                <nav className="p-4 bg-surface border-b border-primary-border flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold text-accent">Affinity</Link>
                    <div className="flex items-center">
                        <span className="mr-4 font-semibold text-primary-text">Welcome, {user.username}!</span>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-primary-border text-primary-text"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link to={`/${user.username}`}>
                            <img
                                src={profilePic}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        </Link>
                    </div>
                </nav>
            )}
            <div className="flex h-[calc(100vh-65px)] bg-background">
                <div
                    className={`
            ${isSidebarMinimized ? 'w-20' : 'w-2/12'}
            relative z-10 bg-surface border-r border-primary-border
            transition-all duration-300 ease-in-out
          `}
                >
                    <Sidebar
                        isMinimized={isSidebarMinimized}
                        onToggle={toggleSidebar}
                    />
                </div>
                <main className="flex-1 overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out">
                    <Outlet />
                </main>
                <div className="w-2/12 border-l border-primary-border bg-surface overflow-y-auto scrollbar-hide">
                    <RightPanel />
                </div>
            </div>
        </div>
    );
}

export default MainLayout;