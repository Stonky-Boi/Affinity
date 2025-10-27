import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // If login is successful, call the login function from context
      login(data.user, data.token);
      // And navigate to the home page
      navigate('/');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // Center content on the page (assuming no MainLayout)
    <div className="flex flex-col justify-center items-center min-h-screen bg-background">
      {/* Use semantic background for the form container */}
      <form onSubmit={handleSubmit} className="p-8 bg-surface shadow-md rounded-lg w-96">
        {/* Use semantic text color for heading */}
        <h1 className="text-2xl font-bold mb-6 text-center text-primary-text">Login</h1>
        {/* Keep red for error messages */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          {/* Use semantic text color for labels */}
          <label className="block text-secondary-text mb-2">Email</label>
          {/* Use semantic classes for input */}
          <input
            type="email"
            className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          {/* Use semantic text color for labels */}
          <label className="block text-secondary-text mb-2">Password</label>
          {/* Use semantic classes for input */}
          <input
            type="password"
            className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* Use semantic classes for the button */}
        <button
          type="submit"
          className="w-full bg-accent text-white font-semibold p-2 rounded-lg hover:brightness-90"
        >
          Login
        </button>
        {/* Add a link to the signup page */}
        <p className="mt-4 text-center text-secondary-text">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;