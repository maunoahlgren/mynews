/**
 * AI News Topics
 *
 * Each entry defines a GNews search topic used by gnewsService.js.
 * The `query` field is passed as the `q` parameter to the GNews /search API.
 *
 * These also drive the filter tabs in the UI — `id`, `name`, and `color`
 * are used by NewsFeed.jsx to render and match the source-tab buttons.
 *
 * To add a new topic:
 *   1. Add a new entry below with a unique `id`.
 *   2. Pick a `query` that returns relevant results on https://gnews.io.
 *   3. Choose a `color` that is visually distinct from existing tabs.
 *
 * API docs: https://gnews.io/docs/v4#search
 */

export const NEWS_SOURCES = [
  {
    id: 'ai-general',
    name: 'AI News',
    query: 'artificial intelligence',
    color: '#6b48ff',
    description: 'General AI news and breakthroughs',
  },
  {
    id: 'ml-research',
    name: 'ML Research',
    query: 'machine learning deep learning research',
    color: '#00b300',
    description: 'Machine learning and research papers',
  },
  {
    id: 'ai-industry',
    name: 'AI Industry',
    query: 'OpenAI Google DeepMind AI startup investment',
    color: '#fa4b2a',
    description: 'AI companies, startups, and business news',
  },
  {
    id: 'ai-ethics',
    name: 'AI Ethics',
    query: 'AI ethics safety regulation policy',
    color: '#f59e0b',
    description: 'AI safety, ethics, and regulation',
  },
  {
    id: 'ai-tools',
    name: 'AI Tools',
    query: 'AI tool product launch app feature release',
    color: '#06b6d4',
    description: 'New AI tools and product launches',
  },
  {
    id: 'robotics',
    name: 'Robotics',
    query: 'robotics autonomous robot',
    color: '#ec4899',
    description: 'Robotics and autonomous systems',
  },
]
