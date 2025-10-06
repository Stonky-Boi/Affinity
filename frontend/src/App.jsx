import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';

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
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;