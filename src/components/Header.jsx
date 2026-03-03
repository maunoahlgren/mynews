import './Header.css'

/**
 * Header
 *
 * Displays the app title, article count, last-refresh time, a manual
 * refresh button, and a dark/light mode toggle.
 *
 * Props
 * -----
 * @prop {number}      articleCount  - Total articles currently loaded
 * @prop {Date|null}   lastUpdated   - When the feed was last fetched
 * @prop {boolean}     loading       - True while a fetch is in progress
 * @prop {function}    onRefresh     - Callback to trigger a manual refresh
 * @prop {'dark'|'light'} theme      - Current theme
 * @prop {function}    onToggleTheme - Callback to toggle dark/light mode
 */
export default function Header({ articleCount, lastUpdated, loading, onRefresh, theme, onToggleTheme }) {
  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-icon">⚡</span>
        <h1 className="header-title">MyNews AI</h1>
        <span className="header-subtitle">AI News Aggregator</span>
      </div>

      <div className="header-meta">
        {articleCount > 0 && (
          <span className="header-count">{articleCount} articles</span>
        )}
        {formattedTime && (
          <span className="header-updated">Updated {formattedTime}</span>
        )}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh news feeds"
        >
          <span className={loading ? 'spin' : ''}>↻</span>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </header>
  )
}
