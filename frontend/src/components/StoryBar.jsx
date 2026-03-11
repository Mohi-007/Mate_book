import { useState, useEffect } from 'react';
import { storiesAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getInitials, getImageUrl } from '../utils/helpers';

export default function StoryBar() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const res = await storiesAPI.getFeed();
      setStoryGroups(res.data.story_groups);
    } catch (err) {
      console.error(err);
    }
  };

  const openStory = (group) => {
    setViewingGroup(group);
    setCurrentIdx(0);
    // Mark first story as viewed
    if (group.stories[0]) {
      storiesAPI.viewStory(group.stories[0].id).catch(() => {});
    }
  };

  const nextStory = () => {
    if (!viewingGroup) return;
    if (currentIdx < viewingGroup.stories.length - 1) {
      const newIdx = currentIdx + 1;
      setCurrentIdx(newIdx);
      storiesAPI.viewStory(viewingGroup.stories[newIdx].id).catch(() => {});
    } else {
      setViewingGroup(null);
    }
  };

  const prevStory = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const reactToStory = async (emoji) => {
    if (!viewingGroup) return;
    const story = viewingGroup.stories[currentIdx];
    try {
      await storiesAPI.reactToStory(story.id, emoji);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="stories-bar">
        {/* Create Story */}
        <div className="story-item" onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('media', file);
            formData.append('caption', '');
            try {
              await storiesAPI.create(formData);
              loadStories();
            } catch (err) {
              console.error(err);
            }
          };
          input.click();
        }}>
          <div className="avatar avatar-lg" style={{ background: 'var(--bg)', fontSize: '2rem' }}>
            ➕
          </div>
          <span className="story-name">Add Story</span>
        </div>

        {storyGroups.map((group) => (
          <div key={group.user.id} className="story-item" onClick={() => openStory(group)}>
            <div className={`story-ring ${group.stories.every(s => s.is_viewed) ? 'viewed' : ''}`}>
              <div className="avatar avatar-lg">
                {group.user.profile_pic ? (
                  <img src={getImageUrl(group.user.profile_pic, API_BASE_URL)} alt="" />
                ) : (
                  getInitials(group.user.username)
                )}
              </div>
            </div>
            <span className="story-name">{group.user.username}</span>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {viewingGroup && (
        <div className="modal-overlay" onClick={() => setViewingGroup(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 420, height: '80vh',
              background: 'var(--black)', borderRadius: 'var(--radius-lg)',
              border: '4px solid var(--black)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 12,
              background: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0,
              left: 0, right: 0, zIndex: 2, color: 'white',
            }}>
              <div className="avatar avatar-sm" style={{ borderColor: 'white' }}>
                {viewingGroup.user.profile_pic ? (
                  <img src={getImageUrl(viewingGroup.user.profile_pic, API_BASE_URL)} alt="" />
                ) : (
                  getInitials(viewingGroup.user.username)
                )}
              </div>
              <strong>{viewingGroup.user.username}</strong>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setViewingGroup(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{
              display: 'flex', gap: 2, padding: '8px 12px',
              position: 'absolute', top: 50, left: 0, right: 0, zIndex: 2,
            }}>
              {viewingGroup.stories.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, background: i <= currentIdx ? 'white' : 'rgba(255,255,255,0.3)',
                  borderRadius: 2,
                }} />
              ))}
            </div>

            {/* Story Content */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {viewingGroup.stories[currentIdx]?.media_type === 'video' ? (
                <video
                  autoPlay
                  controls
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                  src={getImageUrl(viewingGroup.stories[currentIdx].media_url, API_BASE_URL)}
                />
              ) : (
                <img
                  src={getImageUrl(viewingGroup.stories[currentIdx]?.media_url, API_BASE_URL)}
                  alt=""
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}

              {/* Navigation areas */}
              <div
                onClick={prevStory}
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer',
                }}
              />
              <div
                onClick={nextStory}
                style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer',
                }}
              />
            </div>

            {/* Reactions */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 12, padding: 12,
              background: 'rgba(0,0,0,0.5)',
            }}>
              {['❤️', '😂', '😮', '😢', '🔥', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => reactToStory(emoji)}
                  style={{
                    fontSize: '1.5rem', background: 'none', border: 'none',
                    cursor: 'pointer', transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.3)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {viewingGroup.stories[currentIdx]?.caption && (
              <div style={{
                position: 'absolute', bottom: 60, left: 0, right: 0,
                textAlign: 'center', color: 'white', fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)', padding: '0 20px',
              }}>
                {viewingGroup.stories[currentIdx].caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
