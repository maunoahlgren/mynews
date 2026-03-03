const HN_BASE = 'https://hacker-news.firebaseio.com/api/v0'

const AI_KEYWORDS = [
  'ai',
  'artificial intelligence',
  'machine learning',
  'llm',
  'gpt',
  'openai',
  'deepmind',
  'anthropic',
  'neural',
  'deep learning',
  'robotics',
  'claude',
  'gemini',
  'mistral',
  'nvidia',
  'nlp',
  'language model',
]

/**
 * Vercel serverless function — fetches AI-related top stories from Hacker News.
 *
 * No API key required — HN's Firebase API is public.
 *
 * Strategy:
 *   1. Fetch the top 200 story IDs from HN
 *   2. Fetch the first 80 story details concurrently
 *   3. Filter for AI/ML-relevant titles using keyword matching
 *   4. Return up to `count` matching stories in a normalised format
 *
 * Query parameters accepted:
 *   count {number} — max articles to return (default 10)
 */
export default async function handler(req, res) {
  const count = Math.min(parseInt(req.query.count ?? '10', 10), 30)

  try {
    const idsRes = await fetch(`${HN_BASE}/topstories.json`)
    if (!idsRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch HN story list' })
    }
    const ids = await idsRes.json()

    // Fetch the first 80 candidates to find enough AI matches
    const candidateIds = ids.slice(0, 80)
    const stories = await Promise.all(
      candidateIds.map(id =>
        fetch(`${HN_BASE}/item/${id}.json`)
          .then(r => r.json())
          .catch(() => null)
      )
    )

    const aiStories = stories.filter(story => {
      if (!story || story.type !== 'story' || !story.title || !story.url) return false
      const title = story.title.toLowerCase()
      return AI_KEYWORDS.some(kw => title.includes(kw))
    })

    const articles = aiStories.slice(0, count).map(story => ({
      title: story.title,
      description: '',
      url: story.url,
      publishedAt: new Date(story.time * 1000).toISOString(),
      image: null,
      source: { name: 'Hacker News' },
    }))

    res.status(200).json({ articles })
  } catch (err) {
    res.status(502).json({ error: `Failed to reach Hacker News: ${err.message}` })
  }
}
