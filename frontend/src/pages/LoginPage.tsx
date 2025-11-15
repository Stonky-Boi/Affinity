import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type React from 'react';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to login');
            }
            login(data.user, data.token);
            navigate('/');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-background">
            <form onSubmit={handleSubmit} className="p-8 bg-surface shadow-md rounded-lg w-96">
                <h1 className="text-2xl font-bold mb-6 text-center text-primary-text">Login</h1>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block text-secondary-text mb-2">Email</label>
                    <input
                        type="email"
                        className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-secondary-text mb-2">Password</label>
                    <input
                        type="password"
                        className="w-full p-2 border border-primary-border rounded-lg bg-background text-primary-text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent text-white font-semibold p-2 rounded-lg hover:brightness-90 disabled:opacity-50"
                >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
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