import { useState, useEffect, useCallback, useRef } from 'react';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import StoryBar from '../components/StoryBar';
import NewsPanel from '../components/NewsPanel';
import MoodPicker from '../components/MoodPicker';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showMood, setShowMood] = useState(!user?.mood);
  const observerRef = useRef();

  const loadPosts = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const res = await postsAPI.getFeed(pageNum);
      if (pageNum === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts((prev) => [...prev, ...res.data.posts]);
      }
      setHasMore(res.data.has_more);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  // Infinite scroll
  const lastPostRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadPosts(nextPage);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, page, loadPosts]);

  const handlePostCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostUpdate = (postId, updatedPost) => {
    if (updatedPost === null) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } else {
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <StoryBar />

        {showMood && (
          <div className="card mb-md">
            <MoodPicker />
            <button
              className="btn-ghost text-sm mt-sm"
              onClick={() => setShowMood(false)}
            >
              Dismiss
            </button>
          </div>
        )}

        <CreatePost onPostCreated={handlePostCreated} />

        <div className="stagger">
          {posts.map((post, idx) => (
            <div key={post.id} ref={idx === posts.length - 1 ? lastPostRef : null}>
              <PostCard
                post={post}
                onUpdate={(updated) => handlePostUpdate(post.id, updated)}
              />
            </div>
          ))}
        </div>

        {loading && (
          <div className="loader"><div className="loader-spinner" /></div>
        )}

        {!loading && posts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No posts yet</h3>
            <p className="text-muted">Be the first to share something!</p>
          </div>
        )}
      </main>

      <aside className="sidebar-right">
        <NewsPanel />
      </aside>
    </div>
  );
}
