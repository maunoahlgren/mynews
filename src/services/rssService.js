/**
 * RSS Service
 *
 * Fetches and normalises AI news articles from RSS feeds.
 *
 * CORS Strategy
 * -------------
 * Browsers block direct RSS/XML requests to third-party domains. We use
 * rss2json.com as a free CORS proxy that converts RSS → JSON. The free
 * tier allows ~10,000 requests/day per feed, which is more than enough
 * for a development or personal-use application.
 *
 * API endpoint:
 *   GET https://api.rss2json.com/v1/api.json?rss_url=<encoded_url>&count=<n>
 *
 * Limitations / Future Improvements
 * ----------------------------------
 * - For production, replace rss2json with a self-hosted backend or a
 *   server-side RSS parser to avoid third-party rate limits.
 * - The free tier does not support `api_key`. Add one for higher quotas:
 *   https://rss2json.com/#premium_api
 */

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json'

/** Number of articles to request per source */
const ARTICLES_PER_SOURCE = 12

/**
 * Fetch and parse a single RSS feed.
 *
 * @param {object} source  - A source entry from src/data/sources.js
 * @param {number} count   - Max articles to return (default: ARTICLES_PER_SOURCE)
 * @returns {Promise<Article[]>}
 */
export async function fetchFeed(source, count = ARTICLES_PER_SOURCE) {
  const apiUrl =
    `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(source.url)}&count=${count}`

  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching feed for "${source.name}"`)
  }

  const data = await response.json()
  if (data.status !== 'ok') {
    throw new Error(`rss2json error for "${source.name}": ${data.message || 'unknown'}`)
  }

  return data.items.map(item => normaliseItem(item, source))
}

/**
 * Fetch all sources concurrently, ignoring individual failures gracefully.
 * Failed sources log a warning instead of crashing the whole app.
 *
 * @param {object[]} sources - Array of source objects
 * @param {number}   count   - Articles per source
 * @returns {Promise<{ articles: Article[], errors: string[] }>}
 */
export async function fetchAllFeeds(sources, count = ARTICLES_PER_SOURCE) {
  const results = await Promise.allSettled(
    sources.map(source => fetchFeed(source, count))
  )

  const articles = []
  const errors = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value)
    } else {
      const msg = `${sources[index].name}: ${result.reason?.message ?? 'unknown error'}`
      console.warn('[rssService] Feed failed:', msg)
      errors.push(msg)
    }
  })

  // Merge all sources and sort newest first
  articles.sort((a, b) => b.publishedAt - a.publishedAt)

  return { articles, errors }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalise an rss2json item into a consistent Article shape.
 *
 * @typedef {object} Article
 * @property {string}   id          - Unique identifier (guid or link)
 * @property {string}   title       - Article title
 * @property {string}   description - Plain-text excerpt (max 220 chars)
 * @property {string}   url         - Full article URL
 * @property {Date}     publishedAt - Publication date
 * @property {string|null} thumbnail - Image URL or null
 * @property {string}   sourceId    - Source identifier (e.g. 'techcrunch-ai')
 * @property {string}   sourceName  - Human-readable source name
 * @property {string}   sourceColor - Hex colour for the source badge
 */
function normaliseItem(item, source) {
  return {
    id: item.guid || item.link,
    title: item.title?.trim() ?? '(no title)',
    description: stripHtml(item.description ?? item.content ?? ''),
    url: item.link,
    publishedAt: new Date(item.pubDate),
    thumbnail: pickThumbnail(item),
    sourceId: source.id,
    sourceName: source.name,
    sourceColor: source.color,
  }
}

/** Remove HTML tags and decode common entities; truncate to ~220 chars */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

/** Pick the best available image from an rss2json item */
function pickThumbnail(item) {
  if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail
  if (item.enclosure?.link?.startsWith('http')) return item.enclosure.link
  // Try extracting the first <img> src from the content
  const match = (item.content ?? '').match(/<img[^>]+src=["']([^"']+)["']/)
  return match ? match[1] : null
}
