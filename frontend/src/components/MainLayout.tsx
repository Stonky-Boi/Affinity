import { Link, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import RightPanel from './RightPanel.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { Sun, Moon } from 'lucide-react';

function MainLayout() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

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
                    </div>
                </nav>
            )}
            <div className="flex h-[calc(100vh-65px)] bg-background">
                <div className="w-2/12 border-r border-primary-border bg-surface relative z-10">
                    <Sidebar />
                </div>
                <main className="w-8/12 overflow-y-auto scrollbar-hide">
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