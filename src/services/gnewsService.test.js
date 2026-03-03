import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchTopic, fetchAllTopics } from './gnewsService'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOPIC_A = {
  id: 'ai-general',
  name: 'AI News',
  query: 'artificial intelligence',
  color: '#6b48ff',
}

const TOPIC_B = {
  id: 'ml-research',
  name: 'ML Research',
  query: 'machine learning',
  color: '#00b300',
}

/** Build a minimal GNews article object, with optional field overrides. */
function makeArticle(overrides = {}) {
  return {
    title: 'Test Article Title',
    description: 'A short description of the article.',
    content: 'Full article content goes here.',
    url: 'https://example.com/article-1',
    image: 'https://example.com/image.jpg',
    publishedAt: '2024-06-01T12:00:00Z',
    source: { name: 'Example News', url: 'https://example.com' },
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
// fetchTopic
// ---------------------------------------------------------------------------

describe('fetchTopic', () => {
  it('returns normalised articles on a successful response', async () => {
    mockFetch({ articles: [makeArticle()] })

    const articles = await fetchTopic(TOPIC_A)

    expect(articles).toHaveLength(1)
    const a = articles[0]
    expect(a.id).toBe('https://example.com/article-1')
    expect(a.title).toBe('Test Article Title')
    expect(a.description).toBe('A short description of the article.')
    expect(a.url).toBe('https://example.com/article-1')
    expect(a.publishedAt).toBeInstanceOf(Date)
    expect(a.publishedAt.toISOString()).toBe('2024-06-01T12:00:00.000Z')
    expect(a.thumbnail).toBe('https://example.com/image.jpg')
    expect(a.sourceId).toBe('ai-general')
    expect(a.sourceName).toBe('Example News')
    expect(a.sourceColor).toBe('#6b48ff')
  })

  it('trims whitespace from the title', async () => {
    mockFetch({ articles: [makeArticle({ title: '  Padded Title  ' })] })

    const [a] = await fetchTopic(TOPIC_A)
    expect(a.title).toBe('Padded Title')
  })

  it('falls back to topic name when article source is missing', async () => {
    mockFetch({ articles: [makeArticle({ source: undefined })] })

    const [a] = await fetchTopic(TOPIC_A)
    expect(a.sourceName).toBe('AI News')
  })

  it('falls back to topic name when article source.name is missing', async () => {
    mockFetch({ articles: [makeArticle({ source: { url: 'https://x.com' } })] })

    const [a] = await fetchTopic(TOPIC_A)
    expect(a.sourceName).toBe('AI News')
  })

  it('truncates description to 220 characters', async () => {
    const long = 'x'.repeat(300)
    mockFetch({ articles: [makeArticle({ description: long })] })

    const [a] = await fetchTopic(TOPIC_A)
    expect(a.description).toHaveLength(220)
  })

  it('sets thumbnail to null when image is null', async () => {
    mockFetch({ articles: [makeArticle({ image: null })] })

    const [a] = await fetchTopic(TOPIC_A)
    expect(a.thumbnail).toBeNull()
  })

  it('sets thumbnail to null when image is absent', async () => {
    const { image: _removed, ...articleNoImage } = makeArticle()
    mockFetch({ articles: [articleNoImage] })

    const [a] = await fetchTopic(TOPIC_A)
    expect(a.thumbnail).toBeNull()
  })

  it('returns an empty array when GNews returns no articles', async () => {
    mockFetch({ articles: [] })

    const articles = await fetchTopic(TOPIC_A)
    expect(articles).toHaveLength(0)
  })

  it('throws on an HTTP error response', async () => {
    mockFetch({}, 429)

    await expect(fetchTopic(TOPIC_A)).rejects.toThrow('HTTP 429')
    await expect(fetchTopic(TOPIC_A)).rejects.toThrow('AI News')
  })

  it('throws on HTTP 401 (bad API key)', async () => {
    mockFetch({ errors: ['Unauthorized'] }, 401)

    await expect(fetchTopic(TOPIC_A)).rejects.toThrow('HTTP 401')
  })

  it('throws when the response body contains no articles array', async () => {
    mockFetch({ errors: ['quota exceeded'] })

    await expect(fetchTopic(TOPIC_A)).rejects.toThrow('Unexpected response')
    await expect(fetchTopic(TOPIC_A)).rejects.toThrow('AI News')
  })

  it('calls /api/news with the topic query and count', async () => {
    mockFetch({ articles: [] })

    await fetchTopic(TOPIC_A, 7)

    const calledUrl = global.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('/api/news')
    expect(calledUrl).toContain(encodeURIComponent('artificial intelligence'))
    expect(calledUrl).toContain('count=7')
  })

  it('respects a custom count argument', async () => {
    mockFetch({ articles: [] })

    await fetchTopic(TOPIC_A, 3)

    const calledUrl = global.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('count=3')
  })
})

// ---------------------------------------------------------------------------
// fetchAllTopics
// ---------------------------------------------------------------------------

describe('fetchAllTopics', () => {
  it('merges articles from multiple topics', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ articles: [makeArticle({ url: 'https://a.com/1' })] }),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ articles: [makeArticle({ url: 'https://b.com/2' })] }),
      })

    const { articles, errors } = await fetchAllTopics([TOPIC_A, TOPIC_B])

    expect(articles).toHaveLength(2)
    expect(errors).toHaveLength(0)
  })

  it('deduplicates articles that appear in multiple topic results', async () => {
    const sharedUrl = 'https://shared.com/story'
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ articles: [makeArticle({ url: sharedUrl })] }),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ articles: [makeArticle({ url: sharedUrl })] }),
      })

    const { articles } = await fetchAllTopics([TOPIC_A, TOPIC_B])

    expect(articles).toHaveLength(1)
    expect(articles[0].url).toBe(sharedUrl)
  })

  it('sorts articles newest-first across topics', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({
          articles: [
            makeArticle({ url: 'https://old.com', publishedAt: '2024-01-01T00:00:00Z' }),
            makeArticle({ url: 'https://new.com', publishedAt: '2024-12-31T00:00:00Z' }),
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({
          articles: [
            makeArticle({ url: 'https://mid.com', publishedAt: '2024-06-15T00:00:00Z' }),
          ],
        }),
      })

    const { articles } = await fetchAllTopics([TOPIC_A, TOPIC_B])

    expect(articles.map(a => a.url)).toEqual([
      'https://new.com',
      'https://mid.com',
      'https://old.com',
    ])
  })

  it('isolates a failing topic — successful topics still return articles', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ articles: [makeArticle({ url: 'https://ok.com/1' })] }),
      })
      .mockResolvedValueOnce({
        ok: false, status: 500,
        json: () => Promise.resolve({}),
      })

    const { articles, errors } = await fetchAllTopics([TOPIC_A, TOPIC_B])

    expect(articles).toHaveLength(1)
    expect(articles[0].url).toBe('https://ok.com/1')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('ML Research')
  })

  it('returns all errors and no articles when every topic fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: () => Promise.resolve({}),
    })

    const { articles, errors } = await fetchAllTopics([TOPIC_A, TOPIC_B])

    expect(articles).toHaveLength(0)
    expect(errors).toHaveLength(2)
  })

  it('returns empty results when given an empty topics array', async () => {
    const { articles, errors } = await fetchAllTopics([])

    expect(articles).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })

  it('includes the failing topic name in the error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 503,
      json: () => Promise.resolve({}),
    })

    const { errors } = await fetchAllTopics([TOPIC_A])
    expect(errors[0]).toContain('AI News')
  })
})
