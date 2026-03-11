import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { timeAgo, getInitials, getImageUrl } from '../utils/helpers';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async () => {
    try {
      const res = await postsAPI.toggleLike(post.id);
      onUpdate?.(res.data.post);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      await postsAPI.toggleSave(post.id);
      onUpdate?.({ ...post, is_saved: !post.is_saved });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    try {
      const res = await postsAPI.sharePost(post.id);
      onUpdate?.(res.data.post);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const res = await postsAPI.getComments(post.id);
        setComments(res.data.comments);
      } catch (err) {
        console.error(err);
      }
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await postsAPI.addComment(post.id, newComment);
      setComments([...comments, res.data.comment]);
      setNewComment('');
      onUpdate?.({ ...post, comments_count: post.comments_count + 1 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await postsAPI.deletePost(post.id);
      onUpdate?.(null); // Signal removal
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="post-card animate-fade">
      <div className="post-header">
        <Link to={`/profile/${post.author?.id}`}>
          <div className="avatar">
            {post.author?.profile_pic ? (
              <img src={getImageUrl(post.author.profile_pic, API_BASE_URL)} alt="" />
            ) : (
              getInitials(post.author?.username)
            )}
          </div>
        </Link>
        <div style={{ flex: 1 }}>
          <Link to={`/profile/${post.author?.id}`} style={{ color: 'var(--text)' }}>
            <strong>{post.author?.username}</strong>
          </Link>
          <div className="text-xs text-muted flex items-center gap-xs">
            {timeAgo(post.created_at)}
            {post.visibility !== 'public' && (
              <span className="badge badge-blue" style={{ marginLeft: 4 }}>
                {post.visibility === 'friends' ? '👥' : '🔒'}
              </span>
            )}
          </div>
        </div>
        {(post.user_id === user?.id || user?.is_admin) && (
          <button className="btn-ghost" onClick={handleDelete} title="Delete">
            🗑️
          </button>
        )}
      </div>

      {post.content && <div className="post-content">{post.content}</div>}

      {post.media_url && (
        post.media_type === 'video' ? (
          <video controls className="post-media">
            <source src={getImageUrl(post.media_url, API_BASE_URL)} />
          </video>
        ) : (
          <img src={getImageUrl(post.media_url, API_BASE_URL)} alt="" className="post-media" />
        )
      )}

      <div className="post-actions">
        <button
          className={`post-action-btn ${post.is_liked ? 'active' : ''}`}
          onClick={handleLike}
        >
          {post.is_liked ? '❤️' : '🤍'} {post.likes_count || ''}
        </button>
        <button className="post-action-btn" onClick={loadComments}>
          💬 {post.comments_count || ''}
        </button>
        <button className="post-action-btn" onClick={handleShare}>
          🔄 {post.shares_count || ''}
        </button>
        <div style={{ flex: 1 }} />
        <button
          className={`post-action-btn ${post.is_saved ? 'saved' : ''}`}
          onClick={handleSave}
        >
          {post.is_saved ? '🔖' : '📌'}
        </button>
      </div>

      {showComments && (
        <div style={{ padding: 'var(--space-md)', borderTop: 'var(--border)' }}>
          {loadingComments ? (
            <div className="loader"><div className="loader-spinner" /></div>
          ) : (
            <div className="stagger">
              {comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div className="avatar avatar-sm">
                    {c.user?.profile_pic ? (
                      <img src={getImageUrl(c.user.profile_pic, API_BASE_URL)} alt="" />
                    ) : (
                      getInitials(c.user?.username)
                    )}
                  </div>
                  <div style={{
                    background: 'var(--bg)', padding: '6px 10px',
                    border: '2px solid var(--black)', borderRadius: 'var(--radius)', flex: 1,
                  }}>
                    <strong className="text-sm">{c.user?.username}</strong>
                    <div className="text-sm">{c.content}</div>
                    <div className="text-xs text-muted">{timeAgo(c.created_at)}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-sm text-muted text-center">No comments yet</div>
              )}
            </div>
          )}
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              className="input"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}
