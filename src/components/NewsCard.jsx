import './NewsCard.css'

/**
 * NewsCard
 *
 * Renders a single AI news article as a card.  Opens the original article
 * in a new tab when clicked.  All data comes from the normalised Article
 * object produced by rssService.js.
 *
 * Props
 * -----
 * @prop {object} article - Normalised article (see rssService.js Article typedef)
 */
export default function NewsCard({ article }) {
  const {
    title,
    description,
    url,
    publishedAt,
    thumbnail,
    sourceName,
    sourceColor,
  } = article

  const timeAgo = formatTimeAgo(publishedAt)
  const fullDate = publishedAt.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <article className="news-card">
      {thumbnail && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="card-image-link">
          <img
            className="card-image"
            src={thumbnail}
            alt=""
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </a>
      )}

      <div className="card-body">
        <div className="card-meta">
          <span
            className="card-source-badge"
            style={{ '--badge-color': sourceColor }}
          >
            {sourceName}
          </span>
          <time className="card-time" dateTime={publishedAt.toISOString()} title={fullDate}>
            {timeAgo}
          </time>
        </div>

        <h2 className="card-title">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h2>

        {description && (
          <p className="card-description">{description}</p>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-read-more"
        >
          Read article →
        </a>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a human-readable relative time string, e.g. "3h ago" */
function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
