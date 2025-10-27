import { Link, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

function MainLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div>
      {/* Top Navigation Bar - Using semantic classes */}
      {user && (
        <nav className="p-4 bg-surface border-b border-primary-border flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-accent">Affinity</Link>
          <div className="flex items-center">
            <span className="mr-4 font-semibold text-primary-text">Welcome, {user.username}!</span>
            {/* 2. Update the theme toggle button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-primary-border text-primary-text"
              aria-label="Toggle theme" // Add accessibility label
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </nav>
      )}
      
      {/* Main 3-Panel Layout - Using semantic classes */}
      {/* Adjust height to account for the navbar (approx h-16 or 64px) */}
      <div className="flex h-[calc(100vh-65px)] bg-background"> 
        <div className="w-1/5 border-r border-primary-border bg-surface"> {/* Added bg-surface */}
          <Sidebar />
        </div>
        <main className="w-3/5 overflow-y-auto"> {/* Removed bg-background (inherits) */}
          <Outlet />
        </main>
        <div className="w-1/5 border-l border-primary-border bg-surface"> {/* Added bg-surface */}
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;