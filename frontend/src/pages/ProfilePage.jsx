import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authAPI, postsAPI, friendsAPI, featuresAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PostCard from '../components/PostCard';
import MoodPicker from '../components/MoodPicker';
import { getInitials, getImageUrl } from '../utils/helpers';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const { accent, changeAccent, THEME_COLORS } = useTheme();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [showTheme, setShowTheme] = useState(false);

  const isOwn = parseInt(userId) === currentUser?.id;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const userRes = await authAPI.getUser(userId);
      setProfileUser(userRes.data.user);
      setBio(userRes.data.user.bio || '');

      const postsRes = await postsAPI.getUserPosts(userId, 1);
      setPosts(postsRes.data.posts);

      if (!isOwn) {
        const statusRes = await friendsAPI.getStatus(userId);
        setFriendStatus(statusRes.data);
      }

      const analyticsRes = await featuresAPI.getAnalytics(userId);
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendAction = async () => {
    try {
      if (!friendStatus || friendStatus.status === 'none') {
        await friendsAPI.sendRequest(parseInt(userId));
      } else if (friendStatus.status === 'pending' && !friendStatus.is_requester) {
        await friendsAPI.acceptRequest(friendStatus.friendship.id);
      } else if (friendStatus.status === 'accepted') {
        await friendsAPI.unfriend(parseInt(userId));
      }
      const res = await friendsAPI.getStatus(userId);
      setFriendStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBio = async () => {
    try {
      const res = await authAPI.updateProfile({ bio });
      updateUser(res.data.user);
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfilePic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profile_pic', file);
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data.user);
      setProfileUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('cover_photo', file);
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data.user);
      setProfileUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const handleThemeChange = async (color) => {
    changeAccent(color);
    try {
      const res = await authAPI.updateProfile({ theme_color: color });
      updateUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const getFriendBtnText = () => {
    if (!friendStatus || friendStatus.status === 'none') return '➕ Add Friend';
    if (friendStatus.status === 'pending') {
      return friendStatus.is_requester ? '⏳ Request Sent' : '✅ Accept';
    }
    if (friendStatus.status === 'accepted') return '✓ Friends';
    return '➕ Add Friend';
  };

  if (!profileUser) {
    return <div className="loader" style={{ marginTop: 100 }}><div className="loader-spinner" /></div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-md)' }}>
      {/* Cover Photo */}
      <div className="profile-header">
        <div className="relative">
          {profileUser.cover_photo ? (
            <img src={getImageUrl(profileUser.cover_photo, API_BASE_URL)} alt="" className="cover-photo" />
          ) : (
            <div className="cover-photo" style={{ background: `linear-gradient(135deg, ${accent}, var(--blue))` }} />
          )}
          {isOwn && (
            <label style={{ position: 'absolute', bottom: 10, right: 10 }}>
              <input type="file" hidden accept="image/*" onChange={handleCoverPhoto} />
              <span className="btn btn-sm">📷 Cover</span>
            </label>
          )}
        </div>

        <div className="profile-info">
          <div className="relative">
            <div className="avatar avatar-xl">
              {profileUser.profile_pic ? (
                <img src={getImageUrl(profileUser.profile_pic, API_BASE_URL)} alt="" />
              ) : (
                getInitials(profileUser.username)
              )}
            </div>
            {isOwn && (
              <label style={{ position: 'absolute', bottom: 0, right: 0 }}>
                <input type="file" hidden accept="image/*" onChange={handleProfilePic} />
                <span className="btn btn-sm btn-icon" style={{ borderRadius: '50%' }}>📷</span>
              </label>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h1>{profileUser.username}</h1>
            <div className="flex items-center gap-sm">
              {profileUser.mood && <span style={{ fontSize: '1.5rem' }}>{profileUser.mood}</span>}
              <span className="badge badge-yellow">🏆 {profileUser.productivity_score || 0}</span>
            </div>
          </div>
          {!isOwn && (
            <button
              className={`btn ${friendStatus?.status === 'accepted' ? 'btn-green' : 'btn-blue'}`}
              onClick={handleFriendAction}
            >
              {getFriendBtnText()}
            </button>
          )}
          {isOwn && (
            <div className="flex gap-xs">
              <button className="btn btn-sm" onClick={() => setShowTheme(!showTheme)}>
                🎨 Theme
              </button>
              <button className="btn btn-sm" onClick={() => setEditing(!editing)}>
                ✏️ Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="card mb-md">
        {editing ? (
          <div>
            <textarea
              className="textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
            />
            <div className="flex gap-xs mt-sm">
              <button className="btn btn-sm btn-green" onClick={handleSaveBio}>Save</button>
              <button className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <p>{profileUser.bio || (isOwn ? 'Click edit to add a bio!' : 'No bio yet')}</p>
        )}
      </div>

      {/* Theme Customizer */}
      {showTheme && isOwn && (
        <div className="card mb-md animate-fade">
          <h3 className="mb-sm">🎨 Profile Theme Customizer</h3>
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

      {/* Mood Picker (own profile) */}
      {isOwn && (
        <div className="card mb-md">
          <MoodPicker />
        </div>
      )}

      {/* Stats */}
      {analytics && (
        <div className="analytics-grid mb-md">
          <div className="stat-card">
            <div className="stat-value">{analytics.total_posts}</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--pink)' }}>{analytics.total_likes}</div>
            <div className="stat-label">Likes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{analytics.total_comments}</div>
            <div className="stat-label">Comments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--orange)' }}>{analytics.productivity_score}</div>
            <div className="stat-label">Score</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-xs mb-md">
        <button className={`tag ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          📝 Posts
        </button>
        <button className={`tag ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          📊 Activity
        </button>
      </div>

      {activeTab === 'posts' && (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={() => loadProfile()} />
          ))}
          {posts.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="text-muted">No posts yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && analytics && (
        <div className="chart-container">
          <h3 className="mb-md">📈 Posts This Week</h3>
          <div className="bar-chart">
            {analytics.daily_posts.map((d, i) => {
              const maxCount = Math.max(...analytics.daily_posts.map((x) => x.count), 1);
              return (
                <div key={i} className="bar-item">
                  <div
                    className="bar"
                    style={{ height: `${(d.count / maxCount) * 100}px` }}
                  />
                  <span className="bar-label">{d.date}</span>
                  <span className="text-xs font-bold">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
