/**
 * AI News Sources
 *
 * We start with 3 high-quality, reliable RSS sources that cover
 * the main angles of AI news:
 *   - Breaking news / startups (TechCrunch)
 *   - Consumer AI / big tech / policy (The Verge)
 *   - Research & industry analysis (The Decoder)
 *
 * Why only 3 to start?
 *   - Each RSS feed is fetched via an external CORS proxy (rss2json.com).
 *     Adding too many feeds at once increases failure surface and slows
 *     initial load. We validate reliability before expanding.
 *   - Three sources already give excellent coverage with minimal overlap.
 *
 * To add a new source:
 *   1. Add a new entry to NEWS_SOURCES below.
 *   2. Make sure the RSS feed URL is publicly accessible.
 *   3. Test via: https://api.rss2json.com/v1/api.json?rss_url=<encoded_url>
 *
 * Planned sources for future phases (see README for roadmap):
 *   - Ars Technica, MIT News, Unite.AI, Towards Data Science, Hacker News
 */

export const NEWS_SOURCES = [
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    color: '#00b300',
    description: 'Breaking AI startup and funding news',
    website: 'https://techcrunch.com/category/artificial-intelligence/',
  },
  {
    id: 'the-verge-ai',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    color: '#fa4b2a',
    description: 'Consumer AI, big tech, and policy coverage',
    website: 'https://www.theverge.com/ai-artificial-intelligence',
  },
  {
    id: 'the-decoder',
    name: 'The Decoder',
    url: 'https://the-decoder.com/feed/',
    color: '#6b48ff',
    description: 'AI research, business and industry analysis',
    website: 'https://the-decoder.com',
  },
]
