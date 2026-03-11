import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!identifier.trim() || !password) {
      setError('Please enter both your email/username and password.');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Cannot reach the server. Please check your internet connection or try again later.');
        console.error('Connection failed:', err);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade">
        <h1>📘 MateBook</h1>
        <p className="text-center text-muted mb-lg">Welcome back! Log in to continue.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Email or Username</label>
            <input
              className="input"
              type="text"
              placeholder="your@email.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : '🚀 Sign In'}
          </button>
        </form>

        <p className="text-center mt-lg text-sm">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>

        <div className="text-center mt-md text-xs text-muted" style={{
          padding: '8px', background: 'var(--bg)', border: '2px solid var(--black)',
          borderRadius: 'var(--radius)',
        }}>
          <strong>Demo Admin:</strong> admin@matebook.com / admin123
        </div>
      </div>
    </div>
  );
}
