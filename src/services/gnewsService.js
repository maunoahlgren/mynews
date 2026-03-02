/**
 * GNews Service
 *
 * Fetches AI news articles from the GNews API (https://gnews.io).
 *
 * Why GNews instead of RSS?
 * -------------------------
 * The previous RSS approach routed all requests through rss2json.com, a free
 * CORS proxy. Its free tier caps at ~10 requests/day per feed — the 10-minute
 * auto-refresh exhausted that quota in under an hour. GNews provides a proper
 * JSON API with CORS headers baked in, so no proxy is needed.
 *
 * Environment variable
 * --------------------
 * Requires VITE_GNEWS_API_KEY set in your .env file (see .env.example).
 * For Vercel: add it under Project → Settings → Environment Variables.
 *
 * API reference: https://gnews.io/docs/v4
 */

const GNEWS_BASE = 'https://gnews.io/api/v4'

/** Articles to request per topic query */
const ARTICLES_PER_TOPIC = 10

/**
 * Fetch all topics concurrently, deduplicate, and sort newest first.
 *
 * @param {object[]} topics - Array of topic objects (see src/data/sources.js)
 * @param {number}   count  - Max articles per topic
 * @returns {Promise<{ articles: Article[], errors: string[] }>}
 */
export async function fetchAllTopics(topics, count = ARTICLES_PER_TOPIC) {
  const results = await Promise.allSettled(
    topics.map(topic => fetchTopic(topic, count))
  )

  const articles = []
  const errors = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value)
    } else {
      const msg = `${topics[index].name}: ${result.reason?.message ?? 'unknown error'}`
      console.warn('[gnewsService] Topic failed:', msg)
      errors.push(msg)
    }
  })

  // Deduplicate by URL — the same article can surface in multiple topic searches
  const seen = new Set()
  const unique = articles.filter(a => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  unique.sort((a, b) => b.publishedAt - a.publishedAt)

  return { articles: unique, errors }
}

/**
 * Fetch a single topic from GNews /search.
 *
 * @param {object} topic - A topic entry from src/data/sources.js
 * @param {number} count - Max articles to return
 * @returns {Promise<Article[]>}
 */
export async function fetchTopic(topic, count = ARTICLES_PER_TOPIC) {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY
  if (!apiKey) throw new Error('VITE_GNEWS_API_KEY is not set')

  const url =
    `${GNEWS_BASE}/search` +
    `?q=${encodeURIComponent(topic.query)}` +
    `&lang=en` +
    `&max=${count}` +
    `&apikey=${apiKey}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching topic "${topic.name}"`)
  }

  const data = await response.json()
  if (!Array.isArray(data.articles)) {
    throw new Error(
      `Unexpected GNews response for "${topic.name}": ${JSON.stringify(data)}`
    )
  }

  return data.articles.map(item => normaliseItem(item, topic))
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a GNews article into a consistent Article shape.
 *
 * @typedef {object} Article
 * @property {string}      id          - Unique identifier (article URL)
 * @property {string}      title       - Article title
 * @property {string}      description - Plain-text excerpt (max 220 chars)
 * @property {string}      url         - Full article URL
 * @property {Date}        publishedAt - Publication date
 * @property {string|null} thumbnail   - Image URL or null
 * @property {string}      sourceId    - Topic identifier (e.g. 'ai-general')
 * @property {string}      sourceName  - Publisher name from GNews metadata
 * @property {string}      sourceColor - Hex colour for the source badge
 */
function normaliseItem(item, topic) {
  return {
    id: item.url,
    title: item.title?.trim() ?? '(no title)',
    description: (item.description ?? '').trim().slice(0, 220),
    url: item.url,
    publishedAt: new Date(item.publishedAt),
    thumbnail: item.image ?? null,
    sourceId: topic.id,
    sourceName: item.source?.name ?? topic.name,
    sourceColor: topic.color,
  }
}
