import { useState, useEffect } from 'react';
import { featuresAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DebatesPage() {
  const { user } = useAuth();
  const [debates, setDebates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [expandedDebate, setExpandedDebate] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => { loadDebates(); }, []);

  const loadDebates = async () => {
    try {
      const res = await featuresAPI.getDebates();
      setDebates(res.data.debates);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await featuresAPI.createDebate({
        topic, description, option_a: optionA, option_b: optionB, duration_hours: 24,
      });
      setShowCreate(false);
      setTopic(''); setDescription(''); setOptionA(''); setOptionB('');
      loadDebates();
    } catch (err) { console.error(err); }
  };

  const handleVote = async (debateId, option) => {
    try {
      const res = await featuresAPI.voteDebate(debateId, option);
      setDebates((prev) => prev.map((d) => d.id === debateId ? res.data.debate : d));
    } catch (err) { console.error(err); }
  };

  const toggleComments = async (debateId) => {
    if (expandedDebate === debateId) {
      setExpandedDebate(null);
      return;
    }
    setExpandedDebate(debateId);
    try {
      const res = await featuresAPI.getDebateComments(debateId);
      setComments(res.data.comments);
    } catch (err) { console.error(err); }
  };

  const addComment = async (debateId, side) => {
    if (!newComment.trim()) return;
    try {
      const res = await featuresAPI.commentDebate(debateId, { content: newComment, side });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-md)' }}>
      <div className="flex justify-between items-center mb-lg">
        <h1>🔥 Community Debates</h1>
        <button className="btn btn-pink" onClick={() => setShowCreate(!showCreate)}>
          ➕ New Debate
        </button>
      </div>

      {showCreate && (
        <form className="card mb-lg animate-fade" onSubmit={handleCreate}>
          <h3 className="mb-md">Create a Debate</h3>
          <div className="form-group">
            <label>Topic</label>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Is remote work better?" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the debate..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Option A</label>
              <input className="input" value={optionA} onChange={(e) => setOptionA(e.target.value)} placeholder="Yes / Agree" required />
            </div>
            <div className="form-group">
              <label>Option B</label>
              <input className="input" value={optionB} onChange={(e) => setOptionB(e.target.value)} placeholder="No / Disagree" required />
            </div>
          </div>
          <button type="submit" className="btn btn-green w-full">🚀 Launch Debate</button>
        </form>
      )}

      <div className="stagger">
        {debates.map((debate) => {
          const total = debate.total_votes || 1;
          const pctA = Math.round((debate.votes_a / total) * 100);
          const pctB = 100 - pctA;

          return (
            <div key={debate.id} className="debate-card">
              <div className="flex items-center gap-sm mb-sm">
                <span className="badge badge-pink">LIVE</span>
                <span className="text-xs text-muted">by {debate.creator?.username}</span>
              </div>
              <h2 style={{ fontSize: '1.2rem' }}>{debate.topic}</h2>
              {debate.description && <p className="text-sm text-muted mt-sm">{debate.description}</p>}

              <div className="debate-options">
                <div
                  className={`debate-option side-a ${debate.user_vote === 'a' ? 'voted' : ''}`}
                  onClick={() => handleVote(debate.id, 'a')}
                >
                  {debate.option_a}
                  <div className="text-sm mt-sm">{pctA}% ({debate.votes_a})</div>
                </div>
                <div
                  className={`debate-option side-b ${debate.user_vote === 'b' ? 'voted' : ''}`}
                  onClick={() => handleVote(debate.id, 'b')}
                >
                  {debate.option_b}
                  <div className="text-sm mt-sm">{pctB}% ({debate.votes_b})</div>
                </div>
              </div>

              <div className="vote-bar">
                <div className="vote-fill-a" style={{ width: `${pctA}%` }} />
                <div className="vote-fill-b" style={{ width: `${pctB}%` }} />
              </div>

              <div className="flex justify-between items-center mt-md">
                <span className="text-sm text-muted">{debate.total_votes} votes • {debate.comments_count} comments</span>
                <button className="btn btn-sm" onClick={() => toggleComments(debate.id)}>
                  💬 {expandedDebate === debate.id ? 'Hide' : 'Comments'}
                </button>
              </div>

              {expandedDebate === debate.id && (
                <div className="mt-md animate-fade" style={{ borderTop: 'var(--border)', paddingTop: 'var(--space-md)' }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{
                      padding: 8, marginBottom: 8, background: 'var(--bg)',
                      border: '2px solid var(--black)', borderRadius: 'var(--radius)',
                      borderLeft: `4px solid ${c.side === 'a' ? 'var(--blue)' : c.side === 'b' ? 'var(--pink)' : 'var(--black)'}`,
                    }}>
                      <strong className="text-sm">{c.user?.username}</strong>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-xs mt-sm">
                    <input
                      className="input"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add to the debate..."
                    />
                    <button className="btn btn-sm btn-blue" onClick={() => addComment(debate.id, 'a')}>A</button>
                    <button className="btn btn-sm btn-pink" onClick={() => addComment(debate.id, 'b')}>B</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {debates.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔥</div>
            <h3>No active debates</h3>
            <p className="text-muted">Start one and spark a discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
