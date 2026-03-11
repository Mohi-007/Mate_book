import { useState, useRef } from 'react';
import { postsAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !media) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('visibility', visibility);
      if (media) formData.append('media', media);

      const res = await postsAPI.create(formData);
      onPostCreated?.(res.data.post);
      setContent('');
      setMedia(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="create-post">
      <div className="flex gap-sm items-center">
        <div className="avatar">
          {user?.profile_pic ? (
            <img src={`${API_BASE_URL}${user.profile_pic}`} alt="" />
          ) : (
            getInitials(user?.username)
          )}
        </div>
        <textarea
          className="create-post-input"
          placeholder={`What's on your mind, ${user?.username}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
        />
      </div>

      {preview && (
        <div style={{ position: 'relative', margin: '8px 0' }}>
          {media?.type?.startsWith('video') ? (
            <video controls style={{ width: '100%', maxHeight: 200, border: 'var(--border)', borderRadius: 'var(--radius)' }}>
              <source src={preview} />
            </video>
          ) : (
            <img src={preview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', border: 'var(--border)', borderRadius: 'var(--radius)' }} />
          )}
          <button
            className="btn btn-sm btn-danger"
            onClick={() => { setMedia(null); setPreview(null); }}
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="create-post-actions">
        <div className="flex gap-xs">
          <input type="file" ref={fileRef} hidden accept="image/*,video/*" onChange={handleMediaChange} />
          <button className="btn btn-sm" onClick={() => fileRef.current.click()}>
            📷 Photo/Video
          </button>
          <select
            className="select"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
          >
            <option value="public">🌍 Public</option>
            <option value="friends">👥 Friends</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !media)}
        >
          {loading ? '...' : '📤 POST'}
        </button>
      </div>
    </div>
  );
}
