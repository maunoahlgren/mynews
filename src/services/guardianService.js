/**
 * Guardian Service
 *
 * Fetches AI news articles from The Guardian via the /api/guardian serverless
 * function, which proxies requests to the Guardian Content API server-side.
 *
 * Requires GUARDIAN_API_KEY set in the Vercel environment.
 * Get a free key at https://open-platform.theguardian.com/access/
 */

const ARTICLES_PER_FETCH = 10

/** Search query used to find AI-related Guardian content */
const GUARDIAN_QUERY = 'artificial intelligence OR machine learning OR AI'

export const GUARDIAN_SOURCE = {
  id: 'guardian',
  name: 'The Guardian',
  color: '#005689',
  description: 'AI coverage from The Guardian',
}

/**
 * Fetch AI-related articles from The Guardian.
 *
 * @param {number} count - Max articles to return
 * @returns {Promise<Article[]>}
 */
export async function fetchGuardianNews(count = ARTICLES_PER_FETCH) {
  const url =
    `/api/guardian` +
    `?query=${encodeURIComponent(GUARDIAN_QUERY)}` +
    `&count=${count}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching The Guardian`)
  }

  const data = await response.json()
  if (!Array.isArray(data.articles)) {
    throw new Error(`Unexpected Guardian response: ${JSON.stringify(data)}`)
  }

  return data.articles.map(item => normaliseItem(item))
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normaliseItem(item) {
  return {
    id: item.url,
    title: item.title?.trim() ?? '(no title)',
    description: (item.description ?? '').trim().slice(0, 220),
    url: item.url,
    publishedAt: new Date(item.publishedAt),
    thumbnail: item.image ?? null,
    sourceId: GUARDIAN_SOURCE.id,
    sourceName: item.source?.name ?? 'The Guardian',
    sourceColor: GUARDIAN_SOURCE.color,
  }
}
