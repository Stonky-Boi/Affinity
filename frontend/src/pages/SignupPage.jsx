import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // Center content on the page
    <div className="flex flex-col justify-center items-center min-h-screen bg-background">
      {/* Use semantic background for the form container */}
      <form onSubmit={handleSubmit} className="p-8 bg-surface shadow-md rounded-lg w-96">
        {/* Use semantic text color for heading */}
        <h1 className="text-2xl font-bold mb-6 text-center text-primary-text">Create an Account</h1>
        {/* Keep red for error messages */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          {/* Use semantic text color for labels */}
          <label className="block text-secondary-text mb-2">Username</label>
          {/* Use semantic classes for input */}
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text" required />
        </div>
        <div className="mb-4">
          {/* Use semantic text color for labels */}
          <label className="block text-secondary-text mb-2">Email</label>
          {/* Use semantic classes for input */}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text" required />
        </div>
        <div className="mb-6">
          {/* Use semantic text color for labels */}
          <label className="block text-secondary-text mb-2">Password</label>
          {/* Use semantic classes for input */}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text" required />
        </div>
        {/* Use semantic classes for the button */}
        <button type="submit" className="w-full bg-accent text-white font-semibold p-2 rounded-lg hover:brightness-90">
          Sign Up
        </button>
         {/* Add a link to the login page */}
         <p className="mt-4 text-center text-secondary-text">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
export default SignupPage;