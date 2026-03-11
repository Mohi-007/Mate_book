import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI, adminAPI, API_BASE_URL } from '../services/api';
import MoodPicker from '../components/MoodPicker';
import { getInitials } from '../utils/helpers';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { accent, changeAccent, THEME_COLORS } = useTheme();
  const [tab, setTab] = useState('profile');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Admin state
  const [stats, setStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (tab === 'admin' && user?.is_admin) {
      loadStats();
      loadUsers(1);
    }
  }, [tab]);

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data.stats);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async (pageNum) => {
    try {
      const res = await adminAPI.getUsers(pageNum);
      setAdminUsers(res.data.users);
      setHasMore(res.data.has_more);
    } catch (err) { console.error(err); }
  };

  const toggleAdmin = async (userId) => {
    try {
      const res = await adminAPI.toggleAdmin(userId);
      setAdminUsers((prev) => prev.map((u) => u.id === userId ? res.data.user : u));
    } catch (err) { console.error(err); }
  };

  const seedChallenges = async () => {
    try {
      await adminAPI.seedChallenges();
      setMessage('Challenges seeded!');
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await authAPI.updateProfile({ username, bio });
      updateUser(res.data.user);
      setMessage('Profile updated!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error saving');
    }
    setSaving(false);
  };

  const handleThemeChange = async (color) => {
    changeAccent(color);
    try {
      const res = await authAPI.updateProfile({ theme_color: color });
      updateUser(res.data.user);
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile', show: true },
    { id: 'theme', label: '🎨 Theme', show: true },
    { id: 'account', label: '🔐 Account', show: true },
    { id: 'admin', label: '🛡️ Admin Panel', show: !!user?.is_admin },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-md)' }}>
      <h1 className="mb-lg">⚙️ Settings</h1>

      {/* Tabs */}
      <div className="flex gap-xs mb-lg" style={{ flexWrap: 'wrap' }}>
        {tabs.filter(t => t.show).map((t) => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card mb-md">
          <h3 className="mb-md">👤 Profile Settings</h3>
          <div className="form-group">
            <label>Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              className="textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
            />
          </div>
          {message && (
            <div className="form-error" style={{
              background: message.includes('Error') ? undefined : 'rgba(0,230,118,0.1)',
              borderColor: message.includes('Error') ? undefined : 'var(--green)',
              color: message.includes('Error') ? undefined : 'var(--green)',
            }}>
              {message}
            </div>
          )}
          <button className="btn btn-primary mt-md" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>

          {/* Mood Picker */}
          <div className="mt-lg">
            <MoodPicker />
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {tab === 'theme' && (
        <div className="card mb-md">
          <h3 className="mb-md">🎨 Profile Theme</h3>
          <p className="text-sm text-muted mb-md">
            Customize your accent color throughout the app.
          </p>
          <div className="color-picker-grid">
            {THEME_COLORS.map((color) => (
              <div
                key={color}
                className={`color-swatch ${accent === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => handleThemeChange(color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Account Tab */}
      {tab === 'account' && (
        <div className="card mb-md">
          <h3 className="mb-md">🔐 Account</h3>
          <div className="text-sm text-muted mb-md">
            <strong>Email:</strong> {user?.email}<br />
            <strong>Joined:</strong> {new Date(user?.created_at).toLocaleDateString()}<br />
            <strong>Verification:</strong> {user?.is_verified ? '✅ Verified' : '❌ Not verified'}<br />
            <strong>Role:</strong> {user?.is_admin ? '🛡️ Admin' : '👤 Member'}
          </div>
          <button className="btn btn-danger" onClick={logout}>
            🚪 Log Out
          </button>
        </div>
      )}

      {/* Admin Panel Tab */}
      {tab === 'admin' && user?.is_admin && (
        <div>
          {/* Platform Stats */}
          {stats && (
            <div className="admin-grid mb-lg">
              <div className="stat-card">
                <div className="stat-value">{stats.total_users}</div>
                <div className="stat-label">Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.total_posts}</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.online_users}</div>
                <div className="stat-label">Online Now</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--pink)' }}>{stats.active_challenges}</div>
                <div className="stat-label">Challenges</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--orange)' }}>{stats.active_debates}</div>
                <div className="stat-label">Debates</div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card mb-lg">
            <h3 className="mb-md">Quick Actions</h3>
            <div className="flex gap-sm">
              <button className="btn btn-green btn-sm" onClick={seedChallenges}>
                🎮 Seed Challenges
              </button>
            </div>
            {message && <div className="text-sm mt-sm" style={{ color: 'var(--green)' }}>{message}</div>}
          </div>

          {/* User Management */}
          <div className="card">
            <h3 className="mb-md">📋 User Management</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: 'var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: 8, fontSize: '0.8rem', textTransform: 'uppercase' }}>User</th>
                    <th style={{ textAlign: 'left', padding: 8, fontSize: '0.8rem', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ textAlign: 'center', padding: 8, fontSize: '0.8rem', textTransform: 'uppercase' }}>Score</th>
                    <th style={{ textAlign: 'center', padding: 8, fontSize: '0.8rem', textTransform: 'uppercase' }}>Admin</th>
                    <th style={{ textAlign: 'center', padding: 8, fontSize: '0.8rem', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--bg)' }}>
                      <td style={{ padding: 8 }}>
                        <div className="flex items-center gap-xs">
                          <div className="avatar avatar-sm">
                            {u.profile_pic ? (
                              <img src={`${API_BASE_URL}${u.profile_pic}`} alt="" />
                            ) : (
                              getInitials(u.username)
                            )}
                          </div>
                          <strong className="text-sm">{u.username}</strong>
                        </div>
                      </td>
                      <td style={{ padding: 8 }} className="text-sm text-muted">{u.email}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        <span className="badge badge-yellow">{u.productivity_score || 0}</span>
                      </td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        {u.is_admin ? '✅' : '—'}
                      </td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        <button
                          className={`btn btn-sm ${u.is_admin ? 'btn-danger' : 'btn-blue'}`}
                          onClick={() => toggleAdmin(u.id)}
                          disabled={u.id === user.id}
                        >
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="text-center mt-md">
                <button className="btn btn-sm" onClick={() => { setUsersPage(usersPage + 1); loadUsers(usersPage + 1); }}>
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
