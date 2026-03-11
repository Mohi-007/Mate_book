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
        <div className="text-center mb-xl">
          <h1 className="brand-logo">📘 MateBook</h1>
          <p className="text-muted">Welcome back! Sign in to continue</p>
        </div>

        {error && <div className="form-error mb-lg">{error}</div>}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group-simple">
            <input
              className="input-premium"
              type="text"
              placeholder="📧 Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              inputMode="email"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group-simple">
            <input
              className="input-premium"
              type="password"
              placeholder="🔒 Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button className="btn btn-primary btn-lg w-full mt-md" type="submit" disabled={loading}>
            {loading ? 'Processing...' : '🚀 Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register" className="link-bold">Sign Up Free</Link>
          </p>
          
          <div className="demo-box mt-xl">
            <p className="text-xs text-muted mb-xs">DEMO ACCESS</p>
            <code>admin@matebook.com / admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
