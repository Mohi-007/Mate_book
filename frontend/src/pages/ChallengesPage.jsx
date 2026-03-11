import { useState, useEffect } from 'react';
import { featuresAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entryContent, setEntryContent] = useState('');

  useEffect(() => { loadChallenges(); }, []);

  const loadChallenges = async () => {
    try {
      const res = await featuresAPI.getChallenges();
      setChallenges(res.data.challenges);
    } catch (err) { console.error(err); }
  };

  const toggleChallenge = async (challengeId) => {
    if (expandedChallenge === challengeId) {
      setExpandedChallenge(null);
      return;
    }
    setExpandedChallenge(challengeId);
    try {
      const res = await featuresAPI.getChallengeEntries(challengeId);
      setEntries(res.data.entries);
    } catch (err) { console.error(err); }
  };

  const submitEntry = async (challengeId) => {
    if (!entryContent.trim()) return;
    try {
      await featuresAPI.enterChallenge(challengeId, { content: entryContent });
      setEntryContent('');
      const res = await featuresAPI.getChallengeEntries(challengeId);
      setEntries(res.data.entries);
      loadChallenges();
    } catch (err) { console.error(err); }
  };

  const getChallengeColor = (type) => {
    switch (type) {
      case 'photo': return 'var(--blue)';
      case 'gratitude': return 'var(--green)';
      case 'creative': return 'var(--pink)';
      case 'fitness': return 'var(--orange)';
      default: return 'var(--yellow)';
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-md)' }}>
      <h1 className="mb-lg">🎮 Daily Challenges</h1>

      <div className="stagger">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="challenge-card">
            <div className="flex items-center gap-sm mb-sm">
              <div className="challenge-type" style={{ color: getChallengeColor(challenge.challenge_type) }}>
                {challenge.challenge_type}
              </div>
              <span className="badge badge-yellow">{challenge.entries_count} entries</span>
            </div>

            <h2 style={{ fontSize: '1.2rem' }}>{challenge.title}</h2>
            <p className="text-sm text-muted mt-sm">{challenge.description}</p>

            <div className="flex gap-xs mt-md">
              <button className="btn btn-sm btn-primary" onClick={() => toggleChallenge(challenge.id)}>
                {expandedChallenge === challenge.id ? '🔼 Hide' : '🔽 View & Participate'}
              </button>
            </div>

            {expandedChallenge === challenge.id && (
              <div className="mt-md animate-fade" style={{ borderTop: 'var(--border)', paddingTop: 'var(--space-md)' }}>
                {/* Submit entry */}
                <div className="flex gap-xs mb-md">
                  <textarea
                    className="textarea"
                    value={entryContent}
                    onChange={(e) => setEntryContent(e.target.value)}
                    placeholder="Share your challenge entry..."
                    rows={2}
                  />
                  <button
                    className="btn btn-green btn-sm"
                    onClick={() => submitEntry(challenge.id)}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    ✨ Submit
                  </button>
                </div>

                {/* Entries */}
                {entries.map((entry) => (
                  <div key={entry.id} style={{
                    padding: 'var(--space-sm)', marginBottom: 8,
                    background: 'var(--bg)', border: '2px solid var(--black)',
                    borderRadius: 'var(--radius)',
                  }}>
                    <div className="flex items-center gap-xs mb-sm">
                      <strong className="text-sm">{entry.user?.username}</strong>
                      <span className="text-xs text-muted">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{entry.content}</p>
                  </div>
                ))}
                {entries.length === 0 && (
                  <p className="text-sm text-muted text-center">No entries yet. Be the first!</p>
                )}
              </div>
            )}
          </div>
        ))}

        {challenges.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🎮</div>
            <h3>No challenges available</h3>
            <p className="text-muted">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
