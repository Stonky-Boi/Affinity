import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import CreatePostPage from './pages/CreatePostPage';
import ProtectedRoute from './components/ProtectedRoute';
import ConversationsPage from './pages/ConversationsPage';
import MainLayout from './components/MainLayout';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import FollowRequestsPage from './pages/FollowRequestsPage';

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="p-4 bg-gray-100 border-b flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">Affinity</Link>
        <div>
          {user ? (
            <>
              <span className="mr-4 font-semibold">Welcome, {user.username}!</span>
              <button onClick={handleLogout} className="font-semibold hover:text-blue-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mr-4 font-semibold">Login</Link>
              <Link to="/signup" className="mr-4 font-semibold">Signup</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/:username" element={<PublicProfilePage />} />
          <Route path="/requests" element={<FollowRequestsPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;