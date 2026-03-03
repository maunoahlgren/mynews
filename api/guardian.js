const GUARDIAN_BASE = 'https://content.guardianapis.com'

/**
 * Vercel serverless function — proxies Guardian API search requests server-side.
 *
 * Environment variable required (Vercel Project → Settings → Env Vars):
 *   GUARDIAN_API_KEY
 *
 * Get a free key at https://open-platform.theguardian.com/access/
 *
 * Query parameters accepted:
 *   query {string} — search terms to forward to the Guardian API
 *   count {number} — max articles to return (default 10)
 */
export default async function handler(req, res) {
  const apiKey = process.env.GUARDIAN_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GUARDIAN_API_KEY is not configured on the server' })
  }

  const { query, count = 10 } = req.query
  if (!query) {
    return res.status(400).json({ error: 'Missing required parameter: query' })
  }

  const url =
    `${GUARDIAN_BASE}/search` +
    `?q=${encodeURIComponent(query)}` +
    `&page-size=${count}` +
    `&show-fields=trailText,thumbnail` +
    `&order-by=newest` +
    `&api-key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.response?.status !== 'ok') {
      return res.status(502).json({ error: 'Guardian API error', detail: data })
    }

    const articles = (data.response.results ?? []).map(item => ({
      title: item.webTitle,
      description: item.fields?.trailText ?? '',
      url: item.webUrl,
      publishedAt: item.webPublicationDate,
      image: item.fields?.thumbnail ?? null,
      source: { name: 'The Guardian' },
    }))

    res.status(200).json({ articles })
  } catch (err) {
    res.status(502).json({ error: `Failed to reach Guardian: ${err.message}` })
  }
}
