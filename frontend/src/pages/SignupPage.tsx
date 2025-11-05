import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type React from 'react';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signup(username, email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during signup.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background">
      <form onSubmit={handleSubmit} className="p-8 bg-surface shadow-md rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-primary-text">Create an Account</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-secondary-text mb-2">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text" required />
        </div>
        <div className="mb-4">
          <label className="block text-secondary-text mb-2">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text" required />
        </div>
        <div className="mb-6">
          <label className="block text-secondary-text mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text" required />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent text-white font-semibold p-2 rounded-lg hover:brightness-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </button>
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