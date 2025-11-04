import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.tsx';
import SignupPage from './pages/SignupPage.tsx';
import HomePage from './pages/HomePage.tsx';
import CreatePostPage from './pages/CreatePostPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import ConversationsPage from './pages/ConversationsPage.tsx';
import MainLayout from './components/MainLayout.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import PublicProfilePage from './pages/PublicProfilePage.tsx';
import FollowRequestsPage from './pages/FollowRequestsPage.tsx';

function App() {
  return (
    <div className="bg-background text-primary-text min-h-screen transition-colors duration-300">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/requests" element={<FollowRequestsPage />} />
          <Route path="/:username" element={<PublicProfilePage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;