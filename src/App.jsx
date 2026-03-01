import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import NewsFeed from './components/NewsFeed'
import { NEWS_SOURCES } from './data/sources'
import { fetchAllFeeds } from './services/rssService'
import './App.css'

/**
 * App — root component
 *
 * Owns all application state:
 *   - articles:       normalised articles from all sources (sorted newest first)
 *   - loading:        true while any fetch is in progress
 *   - errors:         array of per-source error messages
 *   - activeSourceId: which source filter tab is selected (null = All)
 *   - lastUpdated:    Date object of most recent successful fetch
 *
 * Data flow:
 *   App (state) → Header (display + refresh trigger)
 *              → NewsFeed → NewsCard
 *
 * Auto-refresh every 10 minutes so the feed stays current without a manual
 * page reload.  The interval is cleared on unmount.
 */

const REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

export default function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const [activeSourceId, setActiveSourceId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadFeeds = useCallback(async () => {
    setLoading(true)
    try {
      const { articles: fetched, errors: fetchErrors } = await fetchAllFeeds(NEWS_SOURCES)
      setArticles(fetched)
      setErrors(fetchErrors)
      setLastUpdated(new Date())
    } catch (err) {
      // Unexpected top-level error (network down, etc.)
      console.error('[App] fetchAllFeeds failed:', err)
      setErrors([err.message])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    loadFeeds()
  }, [loadFeeds])

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const timer = setInterval(loadFeeds, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [loadFeeds])

  return (
    <div className="app">
      <Header
        articleCount={articles.length}
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={loadFeeds}
      />
      <main className="app-main">
        <NewsFeed
          articles={articles}
          sources={NEWS_SOURCES}
          activeSourceId={activeSourceId}
          loading={loading}
          errors={errors}
          onSourceChange={setActiveSourceId}
        />
      </main>
    </div>
  )
}
