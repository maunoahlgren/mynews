import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchHackerNews, HACKERNEWS_SOURCE } from './hackerNewsService'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Build a minimal normalised HN article as returned by /api/hackernews */
function makeHnArticle(overrides = {}) {
  return {
    title: 'OpenAI releases new model',
    description: '',
    url: 'https://example.com/hn-article-1',
    publishedAt: '2024-06-01T12:00:00Z',
    image: null,
    source: { name: 'Hacker News' },
    ...overrides,
  }
}

/** Set up global.fetch to resolve with the given payload and HTTP status. */
function mockFetch(payload, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(payload),
  })
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// HACKERNEWS_SOURCE constant
// ---------------------------------------------------------------------------

describe('HACKERNEWS_SOURCE', () => {
  it('has the expected shape', () => {
    expect(HACKERNEWS_SOURCE.id).toBe('hackernews')
    expect(HACKERNEWS_SOURCE.name).toBe('HackerNews')
    expect(typeof HACKERNEWS_SOURCE.color).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// fetchHackerNews
// ---------------------------------------------------------------------------

describe('fetchHackerNews', () => {
  it('returns normalised articles on a successful response', async () => {
    mockFetch({ articles: [makeHnArticle()] })

    const articles = await fetchHackerNews()

    expect(articles).toHaveLength(1)
    const a = articles[0]
    expect(a.id).toBe('https://example.com/hn-article-1')
    expect(a.title).toBe('OpenAI releases new model')
    expect(a.description).toBe('')
    expect(a.url).toBe('https://example.com/hn-article-1')
    expect(a.publishedAt).toBeInstanceOf(Date)
    expect(a.thumbnail).toBeNull()
    expect(a.sourceId).toBe('hackernews')
    expect(a.sourceName).toBe('Hacker News')
    expect(a.sourceColor).toBe(HACKERNEWS_SOURCE.color)
  })

  it('trims whitespace from the title', async () => {
    mockFetch({ articles: [makeHnArticle({ title: '  AI Breakthrough  ' })] })

    const [a] = await fetchHackerNews()
    expect(a.title).toBe('AI Breakthrough')
  })

  it('truncates description to 220 characters', async () => {
    const long = 'x'.repeat(300)
    mockFetch({ articles: [makeHnArticle({ description: long })] })

    const [a] = await fetchHackerNews()
    expect(a.description).toHaveLength(220)
  })

  it('falls back to "Hacker News" when source is missing', async () => {
    mockFetch({ articles: [makeHnArticle({ source: undefined })] })

    const [a] = await fetchHackerNews()
    expect(a.sourceName).toBe('Hacker News')
  })

  it('falls back to "(no title)" when title is missing', async () => {
    mockFetch({ articles: [makeHnArticle({ title: undefined })] })

    const [a] = await fetchHackerNews()
    expect(a.title).toBe('(no title)')
  })

  it('returns an empty array when the API returns no articles', async () => {
    mockFetch({ articles: [] })

    const articles = await fetchHackerNews()
    expect(articles).toHaveLength(0)
  })

  it('calls /api/hackernews with the given count', async () => {
    mockFetch({ articles: [] })

    await fetchHackerNews(5)

    const calledUrl = global.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('/api/hackernews')
    expect(calledUrl).toContain('count=5')
  })

  it('throws on an HTTP error response', async () => {
    mockFetch({}, 502)

    await expect(fetchHackerNews()).rejects.toThrow('HTTP 502')
  })

  it('throws when the response body contains no articles array', async () => {
    mockFetch({ error: 'something went wrong' })

    await expect(fetchHackerNews()).rejects.toThrow('Unexpected HackerNews response')
  })

  it('sets thumbnail to null when image is absent', async () => {
    const { image: _removed, ...noImage } = makeHnArticle()
    mockFetch({ articles: [noImage] })

    const [a] = await fetchHackerNews()
    expect(a.thumbnail).toBeNull()
  })

  it('parses publishedAt as a Date', async () => {
    mockFetch({ articles: [makeHnArticle({ publishedAt: '2024-03-15T09:30:00Z' })] })

    const [a] = await fetchHackerNews()
    expect(a.publishedAt).toBeInstanceOf(Date)
    expect(a.publishedAt.toISOString()).toBe('2024-03-15T09:30:00.000Z')
  })
})
