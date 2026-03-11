import { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';

const CATEGORIES = ['general', 'technology', 'sports', 'business', 'entertainment', 'health'];

export default function NewsPanel({ fullPage = false }) {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [category]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await newsAPI.getNews(category);
      setArticles(res.data.articles || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-md">
        <h3>📰 {fullPage ? 'Daily News' : 'Trending News'}</h3>
      </div>

      {fullPage && (
        <div className="flex gap-xs mb-md" style={{ flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`tag ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : (
        <div className="stagger">
          {articles.slice(0, fullPage ? 20 : 5).map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="news-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt=""
                  className="news-thumb"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div>
                <div className="news-title">{article.title}</div>
                <div className="news-source">
                  {article.source?.name} • {new Date(article.publishedAt).toLocaleDateString()}
                </div>
              </div>
            </a>
          ))}
          {articles.length === 0 && (
            <div className="text-sm text-muted text-center p-md">No news available</div>
          )}
        </div>
      )}
    </div>
  );
}
