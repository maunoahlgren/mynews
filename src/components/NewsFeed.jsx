import NewsCard from './NewsCard'
import './NewsFeed.css'

/**
 * NewsFeed
 *
 * Renders the source-filter tabs and the grid of NewsCard components.
 * It is a pure display component — all state lives in App.jsx.
 *
 * Props
 * -----
 * @prop {object[]}    articles       - All fetched articles (already sorted newest first)
 * @prop {object[]}    sources        - Source definitions from src/data/sources.js
 * @prop {string|null} activeSourceId - Currently selected source filter, or null = "All"
 * @prop {boolean}     loading        - True while fetching
 * @prop {string[]}    errors         - Array of error messages from failed feeds
 * @prop {function}    onSourceChange - (sourceId: string|null) => void
 */
export default function NewsFeed({
  articles,
  sources,
  activeSourceId,
  loading,
  errors,
  onSourceChange,
}) {
  // Apply source filter
  const filtered = activeSourceId
    ? articles.filter(a => a.sourceId === activeSourceId)
    : articles

  return (
    <div className="news-feed">
      {/* Source filter tabs */}
      <nav className="source-tabs" aria-label="Filter by source">
        <button
          className={`source-tab ${activeSourceId === null ? 'active' : ''}`}
          onClick={() => onSourceChange(null)}
        >
          All
          <span className="tab-count">{articles.length}</span>
        </button>

        {sources.map(source => {
          const count = articles.filter(a => a.sourceId === source.id).length
          return (
            <button
              key={source.id}
              className={`source-tab ${activeSourceId === source.id ? 'active' : ''}`}
              style={{ '--tab-color': source.color }}
              onClick={() => onSourceChange(source.id)}
            >
              <span
                className="tab-dot"
                style={{ background: source.color }}
              />
              {source.name}
              <span className="tab-count">{count}</span>
            </button>
          )
        })}
      </nav>

      {/* Error banners — shown per failed source, non-blocking */}
      {errors.length > 0 && (
        <div className="feed-errors">
          {errors.map((err, i) => (
            <p key={i} className="feed-error-item">
              ⚠ Could not load: {err}
            </p>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && articles.length === 0 && (
        <div className="feed-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-skeleton" aria-hidden="true">
              <div className="skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line medium" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="feed-empty">
          <p>No articles found.{activeSourceId ? ' Try selecting a different source.' : ''}</p>
        </div>
      )}

      {/* Article grid */}
      {filtered.length > 0 && (
        <div className="feed-grid">
          {filtered.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
