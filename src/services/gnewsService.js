/**
 * GNews Service
 *
 * Fetches AI news articles via the /api/news serverless function, which
 * proxies requests to the GNews API (https://gnews.io) server-side.
 *
 * Why a server-side proxy?
 * ------------------------
 * Vite bakes VITE_* env vars into the client bundle at build time. If the
 * variable is absent when Vercel builds, it stays missing forever in that
 * bundle — no redeploy from the dashboard fixes it without a full rebuild.
 * Moving the key to a serverless function (GNEWS_API_KEY, no VITE_ prefix)
 * keeps it server-side and avoids the bake-time issue entirely.
 *
 * Local development
 * -----------------
 * Run `vercel dev` instead of `vite` so the /api/news function is served
 * alongside the Vite dev server. Set GNEWS_API_KEY in your .env file.
 *
 * API reference: https://gnews.io/docs/v4
 */

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
 * Fetch a single topic via the /api/news proxy.
 *
 * @param {object} topic - A topic entry from src/data/sources.js
 * @param {number} count - Max articles to return
 * @returns {Promise<Article[]>}
 */
export async function fetchTopic(topic, count = ARTICLES_PER_TOPIC) {
  const url =
    `/api/news` +
    `?query=${encodeURIComponent(topic.query)}` +
    `&count=${count}`

  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status} fetching topic "${topic.name}": ${body}`)
  }

  const data = await response.json()
  if (!Array.isArray(data.articles)) {
    throw new Error(
      `Unexpected response for "${topic.name}": ${JSON.stringify(data)}`
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
