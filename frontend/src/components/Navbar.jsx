import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, getImageUrl } from '../utils/helpers';
import { API_BASE_URL } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        📘 MateBook
      </Link>

      <ul className="navbar-nav">
        <li>
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            🏠 <span>Feed</span>
          </Link>
        </li>
        <li>
          <Link to="/chat" className={`nav-link ${isActive('/chat')}`}>
            💬 <span>Chat</span>
          </Link>
        </li>
        <li>
          <Link to="/news" className={`nav-link ${isActive('/news')}`}>
            📰 <span>News</span>
          </Link>
        </li>
        <li>
          <Link to="/persona" className={`nav-link ${isActive('/persona')}`}>
            🐦 <span>Persona</span>
          </Link>
        </li>
        <li>
          <Link to="/debates" className={`nav-link ${isActive('/debates')}`}>
            🔥 <span>Debates</span>
          </Link>
        </li>
        <li>
          <Link to="/settings" className={`nav-link ${isActive('/settings')}`}>
            ⚙️ <span>Settings</span>
          </Link>
        </li>
        <li>
          <Link to={`/profile/${user.id}`} className={`nav-link ${isActive(`/profile/${user.id}`)}`}>
            <div className="avatar avatar-sm">
              {user.profile_pic ? (
                <img src={getImageUrl(user.profile_pic, API_BASE_URL)} alt="" />
              ) : (
                getInitials(user.username)
              )}
            </div>
            <span>{user.username}</span>
          </Link>
        </li>
        <li>
          <button className="nav-link" onClick={logout} title="Logout">
            🚪
          </button>
        </li>
      </ul>
    </nav>
  );
}
