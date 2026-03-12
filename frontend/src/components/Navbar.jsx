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
    <>
      {/* ── Top Navbar (always visible) ── */}
      <nav className="navbar">
        <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
          📘 MateBook
        </Link>

        {/* Desktop nav links (hidden on mobile) */}
        <ul className="navbar-nav desktop-nav">
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

        {/* Mobile: show profile + logout only in top bar */}
        <div className="mobile-top-actions">
          <Link to={`/profile/${user.id}`} className={`nav-link ${isActive(`/profile/${user.id}`)}`}>
            <div className="avatar avatar-sm">
              {user.profile_pic ? (
                <img src={getImageUrl(user.profile_pic, API_BASE_URL)} alt="" />
              ) : (
                getInitials(user.username)
              )}
            </div>
          </Link>
          <button className="nav-link" onClick={logout} title="Logout">
            🚪
          </button>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="bottom-nav">
        <Link to="/" className={`bottom-nav-item ${isActive('/')}`}>
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-label">Feed</span>
        </Link>
        <Link to="/chat" className={`bottom-nav-item ${isActive('/chat')}`}>
          <span className="bottom-nav-icon">💬</span>
          <span className="bottom-nav-label">Chat</span>
        </Link>
        <Link to="/persona" className={`bottom-nav-item ${isActive('/persona')}`}>
          <span className="bottom-nav-icon">🐦</span>
          <span className="bottom-nav-label">Persona</span>
        </Link>
        <Link to="/debates" className={`bottom-nav-item ${isActive('/debates')}`}>
          <span className="bottom-nav-icon">🔥</span>
          <span className="bottom-nav-label">Debates</span>
        </Link>
        <Link to="/settings" className={`bottom-nav-item ${isActive('/settings')}`}>
          <span className="bottom-nav-icon">⚙️</span>
          <span className="bottom-nav-label">More</span>
        </Link>
      </nav>
    </>
  );
}
