import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import NewsFeed from './components/NewsFeed'
import { NEWS_SOURCES } from './data/sources'
import { fetchAllTopics } from './services/gnewsService'
import { fetchHackerNews, HACKERNEWS_SOURCE } from './services/hackerNewsService'
import { fetchGuardianNews, GUARDIAN_SOURCE } from './services/guardianService'
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
 *   - theme:          'dark' | 'light' — persisted to localStorage
 *
 * Data flow:
 *   App (state) → Header (display + refresh trigger + theme toggle)
 *              → NewsFeed → NewsCard
 *
 * Auto-refresh every 10 minutes so the feed stays current without a manual
 * page reload.  The interval is cleared on unmount.
 */

const REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

/** All source definitions shown as filter tabs (topics + providers) */
const ALL_SOURCES = [...NEWS_SOURCES, HACKERNEWS_SOURCE, GUARDIAN_SOURCE]

/** Read the initial theme from localStorage, falling back to system preference */
function getInitialTheme() {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const [activeSourceId, setActiveSourceId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)

  // Apply theme to <html> and persist to localStorage whenever it changes
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const loadFeeds = useCallback(async () => {
    setLoading(true)
    try {
      const [gnewsResult, hnResult, guardianResult] = await Promise.allSettled([
        fetchAllTopics(NEWS_SOURCES),
        fetchHackerNews(),
        fetchGuardianNews(),
      ])

      const allArticles = []
      const allErrors = []

      if (gnewsResult.status === 'fulfilled') {
        allArticles.push(...gnewsResult.value.articles)
        allErrors.push(...gnewsResult.value.errors)
      } else {
        const msg = `GNews: ${gnewsResult.reason?.message ?? 'unknown error'}`
        console.warn('[App] GNews failed:', msg)
        allErrors.push(msg)
      }

      if (hnResult.status === 'fulfilled') {
        allArticles.push(...hnResult.value)
      } else {
        const msg = `HackerNews: ${hnResult.reason?.message ?? 'unknown error'}`
        console.warn('[App] HackerNews failed:', msg)
        allErrors.push(msg)
      }

      if (guardianResult.status === 'fulfilled') {
        allArticles.push(...guardianResult.value)
      } else {
        const msg = `The Guardian: ${guardianResult.reason?.message ?? 'unknown error'}`
        console.warn('[App] Guardian failed:', msg)
        allErrors.push(msg)
      }

      // Deduplicate by URL across all providers
      const seen = new Set()
      const unique = allArticles.filter(a => {
        if (seen.has(a.url)) return false
        seen.add(a.url)
        return true
      })

      unique.sort((a, b) => b.publishedAt - a.publishedAt)

      setArticles(unique)
      setErrors(allErrors)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[App] loadFeeds failed:', err)
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
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="app-main">
        <NewsFeed
          articles={articles}
          sources={ALL_SOURCES}
          activeSourceId={activeSourceId}
          loading={loading}
          errors={errors}
          onSourceChange={setActiveSourceId}
        />
      </main>
    </div>
  )
}
