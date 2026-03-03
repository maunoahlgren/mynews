const GNEWS_BASE = 'https://gnews.io/api/v4'

/**
 * Vercel serverless function — proxies GNews search requests server-side.
 *
 * Why server-side?
 * Vite bakes VITE_* env vars into the client bundle at build time. If the
 * variable is absent when Vercel builds, it remains absent forever in that
 * bundle. Keeping the key here (as GNEWS_API_KEY, no VITE_ prefix) means it
 * never touches the client at all, and is read fresh on every request.
 *
 * Query parameters accepted:
 *   query {string} — search terms to forward to GNews
 *   count {number} — max articles to return (default 10)
 *
 * Environment variable required (Vercel Project → Settings → Env Vars):
 *   GNEWS_API_KEY
 */
export default async function handler(req, res) {
  const apiKey = process.env.GNEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GNEWS_API_KEY is not configured on the server' })
  }

  const { query, count = 10 } = req.query
  if (!query) {
    return res.status(400).json({ error: 'Missing required parameter: query' })
  }

  const url =
    `${GNEWS_BASE}/search` +
    `?q=${encodeURIComponent(query)}` +
    `&lang=en` +
    `&max=${count}` +
    `&apikey=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(502).json({ error: `Failed to reach GNews: ${err.message}` })
  }
}
