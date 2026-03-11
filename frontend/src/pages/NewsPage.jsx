import NewsPanel from '../components/NewsPanel';

export default function NewsPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-md)' }}>
      <h1 className="mb-lg">📰 Daily News</h1>
      <NewsPanel fullPage={true} />
    </div>
  );
}
