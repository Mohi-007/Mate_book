import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (!user) return null;

  return (
    <aside className="sidebar-left">
      <nav>
        <ul className="sidebar-nav stagger">
          <li>
            <Link to="/" className={`sidebar-nav-item ${isActive('/')}`}>
              🏠 Feed
            </Link>
          </li>
          <li>
            <Link to={`/profile/${user.id}`} className={`sidebar-nav-item ${isActive(`/profile/${user.id}`)}`}>
              👤 My Profile
            </Link>
          </li>
          <li>
            <Link to="/chat" className={`sidebar-nav-item ${isActive('/chat')}`}>
              💬 Messages
            </Link>
          </li>
          <li>
            <Link to="/friends" className={`sidebar-nav-item ${isActive('/friends')}`}>
              👥 Friends
            </Link>
          </li>
          <li>
            <Link to="/saved" className={`sidebar-nav-item ${isActive('/saved')}`}>
              🔖 Saved Posts
            </Link>
          </li>
          <li>
            <Link to="/news" className={`sidebar-nav-item ${isActive('/news')}`}>
              📰 News
            </Link>
          </li>
          <li>
            <Link to="/persona" className={`sidebar-nav-item ${isActive('/persona')}`}>
              🐦 Persona
            </Link>
          </li>
          <li>
            <Link to="/debates" className={`sidebar-nav-item ${isActive('/debates')}`}>
              🔥 Debate Rooms
            </Link>
          </li>
          <li>
            <Link to="/challenges" className={`sidebar-nav-item ${isActive('/challenges')}`}>
              🎮 Challenges
            </Link>
          </li>
          <li>
            <Link to="/analytics" className={`sidebar-nav-item ${isActive('/analytics')}`}>
              📊 Analytics
            </Link>
          </li>
          <li>
            <Link to="/settings" className={`sidebar-nav-item ${isActive('/settings')}`}>
              ⚙️ Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* Mood Display */}
      {user.mood && (
        <div className="card-flat mt-lg" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>{user.mood}</div>
          <div className="text-xs text-muted mt-sm">Current Mood</div>
        </div>
      )}

      {/* Productivity Score */}
      <div className="card-flat mt-sm" style={{ padding: '12px', textAlign: 'center' }}>
        <div className="font-black" style={{ fontSize: '1.3rem', color: 'var(--blue)' }}>
          🏆 {user.productivity_score || 0}
        </div>
        <div className="text-xs text-muted">Productivity Score</div>
      </div>
    </aside>
  );
}
