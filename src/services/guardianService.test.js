import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchGuardianNews, GUARDIAN_SOURCE } from './guardianService'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Build a minimal normalised Guardian article as returned by /api/guardian */
function makeGuardianArticle(overrides = {}) {
  return {
    title: 'AI regulation moves forward in Europe',
    description: 'A brief description of the article.',
    url: 'https://theguardian.com/article-1',
    publishedAt: '2024-06-01T12:00:00Z',
    image: 'https://media.guim.co.uk/image.jpg',
    source: { name: 'The Guardian' },
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
// GUARDIAN_SOURCE constant
// ---------------------------------------------------------------------------

describe('GUARDIAN_SOURCE', () => {
  it('has the expected shape', () => {
    expect(GUARDIAN_SOURCE.id).toBe('guardian')
    expect(GUARDIAN_SOURCE.name).toBe('The Guardian')
    expect(typeof GUARDIAN_SOURCE.color).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// fetchGuardianNews
// ---------------------------------------------------------------------------

describe('fetchGuardianNews', () => {
  it('returns normalised articles on a successful response', async () => {
    mockFetch({ articles: [makeGuardianArticle()] })

    const articles = await fetchGuardianNews()

    expect(articles).toHaveLength(1)
    const a = articles[0]
    expect(a.id).toBe('https://theguardian.com/article-1')
    expect(a.title).toBe('AI regulation moves forward in Europe')
    expect(a.description).toBe('A brief description of the article.')
    expect(a.url).toBe('https://theguardian.com/article-1')
    expect(a.publishedAt).toBeInstanceOf(Date)
    expect(a.thumbnail).toBe('https://media.guim.co.uk/image.jpg')
    expect(a.sourceId).toBe('guardian')
    expect(a.sourceName).toBe('The Guardian')
    expect(a.sourceColor).toBe(GUARDIAN_SOURCE.color)
  })

  it('trims whitespace from the title', async () => {
    mockFetch({ articles: [makeGuardianArticle({ title: '  Padded Title  ' })] })

    const [a] = await fetchGuardianNews()
    expect(a.title).toBe('Padded Title')
  })

  it('truncates description to 220 characters', async () => {
    const long = 'y'.repeat(300)
    mockFetch({ articles: [makeGuardianArticle({ description: long })] })

    const [a] = await fetchGuardianNews()
    expect(a.description).toHaveLength(220)
  })

  it('falls back to "The Guardian" when source is missing', async () => {
    mockFetch({ articles: [makeGuardianArticle({ source: undefined })] })

    const [a] = await fetchGuardianNews()
    expect(a.sourceName).toBe('The Guardian')
  })

  it('falls back to "(no title)" when title is missing', async () => {
    mockFetch({ articles: [makeGuardianArticle({ title: undefined })] })

    const [a] = await fetchGuardianNews()
    expect(a.title).toBe('(no title)')
  })

  it('sets thumbnail to null when image is absent', async () => {
    const { image: _removed, ...noImage } = makeGuardianArticle()
    mockFetch({ articles: [noImage] })

    const [a] = await fetchGuardianNews()
    expect(a.thumbnail).toBeNull()
  })

  it('sets thumbnail to null when image is null', async () => {
    mockFetch({ articles: [makeGuardianArticle({ image: null })] })

    const [a] = await fetchGuardianNews()
    expect(a.thumbnail).toBeNull()
  })

  it('returns an empty array when the API returns no articles', async () => {
    mockFetch({ articles: [] })

    const articles = await fetchGuardianNews()
    expect(articles).toHaveLength(0)
  })

  it('calls /api/guardian with a query and the given count', async () => {
    mockFetch({ articles: [] })

    await fetchGuardianNews(7)

    const calledUrl = global.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('/api/guardian')
    expect(calledUrl).toContain('query=')
    expect(calledUrl).toContain('count=7')
  })

  it('throws on an HTTP error response', async () => {
    mockFetch({}, 500)

    await expect(fetchGuardianNews()).rejects.toThrow('HTTP 500')
  })

  it('throws on HTTP 401 (bad or missing API key)', async () => {
    mockFetch({ error: 'GUARDIAN_API_KEY is not configured on the server' }, 500)

    await expect(fetchGuardianNews()).rejects.toThrow('HTTP 500')
  })

  it('throws when the response body contains no articles array', async () => {
    mockFetch({ error: 'something went wrong' })

    await expect(fetchGuardianNews()).rejects.toThrow('Unexpected Guardian response')
  })

  it('parses publishedAt as a Date', async () => {
    mockFetch({ articles: [makeGuardianArticle({ publishedAt: '2024-09-20T14:00:00Z' })] })

    const [a] = await fetchGuardianNews()
    expect(a.publishedAt).toBeInstanceOf(Date)
    expect(a.publishedAt.toISOString()).toBe('2024-09-20T14:00:00.000Z')
  })
})
