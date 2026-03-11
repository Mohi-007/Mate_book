import { useState, useEffect } from 'react';
import { featuresAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await featuresAPI.getAnalytics(user?.id);
      setAnalytics(res.data.analytics);
    } catch (err) { console.error(err); }
  };

  if (!analytics) {
    return <div className="loader" style={{ marginTop: 100 }}><div className="loader-spinner" /></div>;
  }

  const maxDailyPosts = Math.max(...analytics.daily_posts.map((d) => d.count), 1);

  // Mood frequency analysis
  const moodCounts = {};
  analytics.mood_history.forEach((m) => {
    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  });
  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-md)' }}>
      <h1 className="mb-lg">📊 Social Analytics Dashboard</h1>

      {/* Key metrics */}
      <div className="analytics-grid">
        <div className="stat-card">
          <div className="stat-value">{analytics.total_posts}</div>
          <div className="stat-label">Total Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{analytics.weekly_posts}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--pink)' }}>{analytics.total_likes}</div>
          <div className="stat-label">Total Likes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{analytics.total_comments}</div>
          <div className="stat-label">Comments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--orange)' }}>🏆 {analytics.productivity_score}</div>
          <div className="stat-label">Productivity</div>
        </div>
      </div>

      {/* Daily Posts Chart */}
      <div className="chart-container">
        <h3 className="mb-md">📈 Posts Activity (Last 7 Days)</h3>
        <div className="bar-chart">
          {analytics.daily_posts.map((d, i) => (
            <div key={i} className="bar-item">
              <div
                className="bar"
                style={{
                  height: `${(d.count / maxDailyPosts) * 100}px`,
                  background: i === analytics.daily_posts.length - 1 ? 'var(--pink)' : 'var(--blue)',
                }}
              />
              <span className="bar-label">{d.date}</span>
              <span className="text-xs font-bold">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Rate */}
      <div className="chart-container">
        <h3 className="mb-md">💡 Engagement Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div>
            <div className="text-sm text-muted mb-sm">Avg Likes Per Post</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--pink)' }}>
              {analytics.total_posts > 0
                ? (analytics.total_likes / analytics.total_posts).toFixed(1)
                : '0'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted mb-sm">Avg Comments Per Post</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--blue)' }}>
              {analytics.total_posts > 0
                ? (analytics.total_comments / analytics.total_posts).toFixed(1)
                : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Mood Analysis */}
      <div className="chart-container">
        <h3 className="mb-md">🎯 Mood Analysis (Last 30 Days)</h3>
        {topMoods.length > 0 ? (
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {topMoods.map(([mood, count]) => (
              <div key={mood} className="stat-card" style={{ flex: '1', minWidth: 100 }}>
                <div style={{ fontSize: '2rem' }}>{mood}</div>
                <div className="font-bold">{count} times</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No mood data yet. Start tracking your mood!</p>
        )}
      </div>

      {/* Productivity Score Breakdown */}
      <div className="chart-container">
        <h3 className="mb-md">🏆 Productivity Score Breakdown</h3>
        <div className="text-sm text-muted mb-md">
          Your score is based on your activity:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Posts Created', points: '+5 each', icon: '📝' },
            { label: 'Comments Made', points: '+2 each', icon: '💬' },
            { label: 'Likes Given', points: '+1 each', icon: '❤️' },
            { label: 'Challenges Completed', points: '+10 each', icon: '🎮' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 8, border: '2px solid var(--black)', borderRadius: 'var(--radius)',
            }}>
              <span>{item.icon} {item.label}</span>
              <span className="badge badge-green">{item.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
