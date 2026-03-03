/**
 * HackerNews Service
 *
 * Fetches AI-related top stories from Hacker News via the /api/hackernews
 * serverless function, which filters and normalises stories server-side.
 *
 * No API key required — HN's public Firebase API is used under the hood.
 */

const ARTICLES_PER_FETCH = 10

export const HACKERNEWS_SOURCE = {
  id: 'hackernews',
  name: 'HackerNews',
  color: '#ff6600',
  description: 'AI and tech stories from Hacker News',
}

/**
 * Fetch AI-related HackerNews top stories.
 *
 * @param {number} count - Max articles to return
 * @returns {Promise<Article[]>}
 */
export async function fetchHackerNews(count = ARTICLES_PER_FETCH) {
  const response = await fetch(`/api/hackernews?count=${count}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching HackerNews`)
  }

  const data = await response.json()
  if (!Array.isArray(data.articles)) {
    throw new Error(`Unexpected HackerNews response: ${JSON.stringify(data)}`)
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
    sourceId: HACKERNEWS_SOURCE.id,
    sourceName: item.source?.name ?? 'Hacker News',
    sourceColor: HACKERNEWS_SOURCE.color,
  }
}
