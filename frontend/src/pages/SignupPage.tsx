import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

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
        <div className="flex min-h-screen bg-background text-primary-text">
            <div className="absolute top-6 right-6">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-primary-border text-primary-text"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
            <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-8 bg-surface">
                <img
                    src="/affinity-logo.jpg"
                    alt="Affinity Logo"
                    className="w-32 h-32 mb-4 text-accent"
                />
                <h1 className="text-5xl font-bold text-accent">Affinity</h1>
                <p className="text-lg text-secondary-text mt-2">Connect with your network.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center p-8">
                <form onSubmit={handleSubmit} className="p-8 bg-surface shadow-lg rounded-lg w-96">
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
        </div>
    );
}

export default SignupPage;