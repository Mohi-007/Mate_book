import { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function SavedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const res = await postsAPI.getSaved();
      setPosts(res.data.posts);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--space-md)' }}>
      <h1 className="mb-lg">🔖 Saved Posts</h1>

      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={() => loadSaved()} />
          ))}
          {posts.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🔖</div>
              <h3>No saved posts</h3>
              <p className="text-muted">Save posts to see them here!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
