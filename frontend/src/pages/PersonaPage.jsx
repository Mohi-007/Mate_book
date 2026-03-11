import { useState, useCallback } from 'react';

const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const HASHTAG_REGEX = /#[\w]+/g;

function analyzeTweets(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;

  const totalChars = lines.reduce((sum, l) => sum + l.length, 0);
  const avgLength = Math.round(totalChars / lines.length);

  // Emoji usage
  const allEmojis = lines.join(' ').match(EMOJI_REGEX) || [];
  const emojiUsage = lines.length > 0
    ? ((lines.filter(l => EMOJI_REGEX.test(l)).length / lines.length) * 100).toFixed(1)
    : 0;

  // Common starters (first 3-4 words)
  const starters = {};
  lines.forEach(l => {
    const words = l.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    if (words.length > 2) {
      starters[words] = (starters[words] || 0) + 1;
    }
  });
  const commonStarters = Object.entries(starters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([s]) => s);

  // Hashtags
  const allHashtags = lines.join(' ').match(HASHTAG_REGEX) || [];
  const hashtagCounts = {};
  allHashtags.forEach(h => {
    hashtagCounts[h.toLowerCase()] = (hashtagCounts[h.toLowerCase()] || 0) + 1;
  });
  const popularHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([h]) => h);

  // Word frequency
  const wordCounts = {};
  lines.forEach(l => {
    l.split(/\s+/).forEach(w => {
      const word = w.toLowerCase().replace(/[^a-z0-9#@]/g, '');
      if (word.length > 3 && !['this', 'that', 'with', 'from', 'have', 'been', 'they', 'were', 'your', 'just', 'like', 'will', 'more', 'about'].includes(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
  });
  const topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Sentiment (basic)
  const posWords = ['great', 'amazing', 'love', 'awesome', 'happy', 'best', 'good', 'excellent', 'wonderful', 'beautiful', 'perfect', 'fantastic'];
  const negWords = ['bad', 'worst', 'hate', 'terrible', 'awful', 'horrible', 'ugly', 'disgusting', 'sad', 'angry', 'annoying'];
  let posCount = 0, negCount = 0;
  lines.forEach(l => {
    const lower = l.toLowerCase();
    posWords.forEach(w => { if (lower.includes(w)) posCount++; });
    negWords.forEach(w => { if (lower.includes(w)) negCount++; });
  });
  const totalSentiment = posCount + negCount || 1;
  const sentiment = posCount > negCount ? 'Positive' : negCount > posCount ? 'Negative' : 'Neutral';
  const sentimentScore = Math.round((posCount / totalSentiment) * 100);

  return {
    totalTweets: lines.length,
    avgLength,
    emojiUsage,
    emojiCount: allEmojis.length,
    commonStarters,
    popularHashtags,
    topWords,
    sentiment,
    sentimentScore,
    lines,
  };
}

function generateTweet(analysis) {
  if (!analysis || analysis.lines.length === 0) return '';
  const starters = analysis.commonStarters;
  const hashtags = analysis.popularHashtags;
  const words = analysis.topWords.map(([w]) => w);

  // Pick random starter or word
  let tweet = '';
  if (starters.length > 0 && Math.random() > 0.3) {
    tweet = starters[Math.floor(Math.random() * starters.length)];
  } else if (words.length > 0) {
    tweet = words.slice(0, 2 + Math.floor(Math.random() * 3)).join(' ');
  }

  // Add some words
  const extraWords = words.filter(w => !tweet.includes(w));
  const numExtra = Math.min(3, extraWords.length);
  for (let i = 0; i < numExtra; i++) {
    tweet += ' ' + extraWords[Math.floor(Math.random() * extraWords.length)];
  }

  // Add hashtag
  if (hashtags.length > 0 && Math.random() > 0.4) {
    tweet += ' ' + hashtags[Math.floor(Math.random() * hashtags.length)];
  }

  // Add emoji if person uses them
  if (parseFloat(analysis.emojiUsage) > 20) {
    const emojis = ['🔥', '💯', '✨', '🚀', '💪', '👏', '❤️', '😂', '🙌', '💡'];
    tweet += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
  }

  return tweet.charAt(0).toUpperCase() + tweet.slice(1);
}

export default function PersonaPage() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [generated, setGenerated] = useState([]);
  const [count, setCount] = useState(3);
  const [csvLoading, setCsvLoading] = useState(false);

  const handleAnalyze = useCallback(() => {
    const result = analyzeTweets(input);
    setAnalysis(result);
    setGenerated([]);
  }, [input]);

  const handleGenerate = useCallback(() => {
    if (!analysis) return;
    const tweets = [];
    for (let i = 0; i < count; i++) {
      tweets.push(generateTweet(analysis));
    }
    setGenerated(tweets);
  }, [analysis, count]);

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      // Parse CSV — assume first column or column named "content"/"text"/"tweet" has the tweet text
      const lines = text.split('\n');
      const header = lines[0]?.toLowerCase() || '';
      const cols = header.split(',');
      let textCol = 0;
      const textNames = ['content', 'text', 'tweet', 'body', 'message'];
      for (let i = 0; i < cols.length; i++) {
        if (textNames.some(n => cols[i].trim().includes(n))) {
          textCol = i;
          break;
        }
      }
      const tweets = lines.slice(1)
        .map(l => {
          const parts = l.split(',');
          return parts[textCol]?.trim()?.replace(/^"|"$/g, '') || '';
        })
        .filter(t => t.length > 5);
      setInput(tweets.join('\n'));
      setCsvLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--space-md)' }}>
      {/* Header */}
      <div className="card mb-lg" style={{ background: 'var(--dark)', color: '#fff', padding: 'var(--space-lg)' }}>
        <div className="flex items-center gap-md" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.8rem' }}>🐦 Twitter Persona Analyzer</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              AI-Powered Tweet Generation — Analyze writing patterns and generate similar tweets
            </p>
          </div>
          <div className="flex items-center gap-xs">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Online (Local Analysis)</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {analysis && (
        <div className="admin-grid mb-lg">
          <div className="stat-card">
            <div className="stat-value">{analysis.totalTweets}</div>
            <div className="stat-label">Total Tweets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--blue)' }}>1</div>
            <div className="stat-label">Personas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{generated.length}</div>
            <div className="stat-label">Generated</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--pink)' }}>
              {analysis.sentiment === 'Positive' ? '😊' : analysis.sentiment === 'Negative' ? '😤' : '😐'}
            </div>
            <div className="stat-label">{analysis.sentiment}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        {/* Upload / Input Panel */}
        <div>
          <div className="card mb-md">
            <h3 className="mb-md">📤 Upload Twitter Data</h3>
            <label
              className="btn btn-blue btn-sm"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              📁 Choose CSV File
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleCSV}
                style={{ display: 'none' }}
              />
            </label>
            <p className="text-xs text-muted mt-sm">
              Required columns: content, user, likes, retweets, replies
            </p>
          </div>

          <div className="card mb-md">
            <h3 className="mb-md">✍️ Or paste tweets (one per line)</h3>
            <textarea
              className="textarea"
              rows={8}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={"Just shipped a new feature for my SaaS app! 🚀\nThe best time to start is now\nGot 2 new clients today #hustle\n..."}
              style={{ fontFamily: 'inherit', fontSize: '0.9rem' }}
            />
            <button
              className="btn btn-primary mt-md"
              onClick={handleAnalyze}
              disabled={!input.trim()}
              style={{ width: '100%' }}
            >
              📊 Upload & Analyze
            </button>
          </div>

          {/* Generate Panel */}
          <div className="card mb-md">
            <h3 className="mb-md">🚀 Generate Tweets</h3>
            <div className="form-group">
              <label className="text-sm">Context</label>
              <textarea
                className="textarea"
                rows={2}
                placeholder='What do you want to tweet about? (e.g., "I just launched a new feature for my SaaS app")'
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <div className="flex gap-sm mt-sm" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="text-xs">Count</label>
                <select className="input" value={count} onChange={e => setCount(Number(e.target.value))}>
                  <option value={1}>1 Tweet</option>
                  <option value={3}>3 Tweets</option>
                  <option value={5}>5 Tweets</option>
                  <option value={10}>10 Tweets</option>
                </select>
              </div>
              <button
                className="btn btn-green"
                onClick={handleGenerate}
                disabled={!analysis}
                style={{ marginBottom: 'var(--space-sm)' }}
              >
                ⚡ Generate
              </button>
            </div>
          </div>
        </div>

        {/* Analysis & Generated Panel */}
        <div>
          {/* Analysis Results */}
          {analysis && (
            <div className="card mb-md">
              <h3 className="mb-md">🧠 Persona Analysis</h3>

              <div className="mb-md">
                <h4 className="text-sm mb-sm" style={{ fontWeight: 700 }}>Writing Patterns</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="card-flat" style={{ padding: 12, textAlign: 'center' }}>
                    <div className="text-xs text-muted">Avg Length</div>
                    <div className="font-black">{analysis.avgLength} chars</div>
                  </div>
                  <div className="card-flat" style={{ padding: 12, textAlign: 'center' }}>
                    <div className="text-xs text-muted">Emoji Usage</div>
                    <div className="font-black">{analysis.emojiUsage}%</div>
                  </div>
                </div>
              </div>

              {analysis.commonStarters.length > 0 && (
                <div className="mb-md">
                  <h4 className="text-sm mb-sm" style={{ fontWeight: 700 }}>Common Starters</h4>
                  <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                    {analysis.commonStarters.map((s, i) => (
                      <span key={i} className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.popularHashtags.length > 0 && (
                <div className="mb-md">
                  <h4 className="text-sm mb-sm" style={{ fontWeight: 700 }}>Popular Hashtags</h4>
                  <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                    {analysis.popularHashtags.map((h, i) => (
                      <span key={i} className="badge badge-yellow" style={{ fontSize: '0.75rem' }}>{h}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.topWords.length > 0 && (
                <div className="mb-md">
                  <h4 className="text-sm mb-sm" style={{ fontWeight: 700 }}>Top Words</h4>
                  <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                    {analysis.topWords.map(([w, c], i) => (
                      <span key={i} className="badge" style={{ fontSize: '0.75rem' }}>{w} ({c})</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm mb-sm" style={{ fontWeight: 700 }}>Sentiment</h4>
                <div style={{
                  background: `linear-gradient(90deg, var(--green) ${analysis.sentimentScore}%, var(--pink) ${analysis.sentimentScore}%)`,
                  height: 8,
                  borderRadius: 4,
                  border: 'var(--border)',
                }} />
                <div className="flex" style={{ justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">Negative</span>
                  <span className="text-xs font-black">{analysis.sentiment} ({analysis.sentimentScore}%)</span>
                  <span className="text-xs text-muted">Positive</span>
                </div>
              </div>
            </div>
          )}

          {/* Generated Tweets */}
          {generated.length > 0 && (
            <div className="card">
              <h3 className="mb-md">🐦 Generated Tweets</h3>
              {generated.map((t, i) => (
                <div key={i} className="card-flat mb-sm" style={{ padding: 12 }}>
                  <div className="flex items-center gap-xs mb-xs">
                    <span style={{ color: 'var(--blue)' }}>🐦</span>
                    <span className="text-xs text-muted">Generated tweet #{i + 1}</span>
                  </div>
                  <p className="text-sm">{t}</p>
                  <div className="flex gap-sm mt-sm">
                    <button
                      className="btn btn-sm"
                      onClick={() => navigator.clipboard.writeText(t)}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!analysis && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🐦</div>
              <p className="text-muted">Generate tweets to see them here</p>
              <p className="text-xs text-muted mt-sm">
                Paste your tweets or upload a CSV file to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
