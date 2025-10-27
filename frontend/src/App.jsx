import { Routes, Route } from 'react-router-dom';
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

// We don't need useAuth or useNavigate here anymore,
// as the top nav bar and logout logic are in MainLayout.

function App() {
  return (
    // Apply base background and text color here using semantic classes
    // Added transition for smooth theme changes
    <div className="bg-background text-primary-text min-h-screen transition-colors duration-300">
      <Routes>
        {/* Public routes don't use MainLayout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes use MainLayout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/requests" element={<FollowRequestsPage />} />
          {/* Ensure this dynamic route is last among the protected ones */}
          <Route path="/:username" element={<PublicProfilePage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;