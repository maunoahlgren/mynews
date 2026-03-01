# MyNews AI — AI News Aggregator

A fast, minimal React app that aggregates AI news from multiple RSS feeds into a single, filterable feed.

## Features

- **Multi-source aggregation** — pulls articles from several AI news feeds concurrently
- **Source filter tabs** — one-click filtering by publication
- **Auto-refresh** — feed refreshes every 10 minutes automatically
- **Manual refresh** — refresh button in the header
- **Graceful degradation** — if one source fails, the rest still load
- **Responsive grid layout** — works on mobile, tablet, and desktop
- **Dark / light mode** — follows the OS preference via `prefers-color-scheme`
- **Loading skeletons** — smooth placeholder UI while fetching
- **Zero external UI dependencies** — plain React + CSS, no component library

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | React 19 + Vite 7                   |
| Language    | JavaScript (ES modules)             |
| Styling     | Vanilla CSS with custom properties  |
| RSS proxy   | [rss2json.com](https://rss2json.com) (free CORS proxy) |
| Linting     | ESLint 9                            |

---

## Architecture

```
src/
├── data/
│   └── sources.js          # Source definitions (id, name, RSS URL, colour)
├── services/
│   └── rssService.js       # Fetch + normalise RSS feeds via rss2json API
├── components/
│   ├── Header.jsx / .css   # Sticky header: title, article count, refresh
│   ├── NewsFeed.jsx / .css # Source tabs + responsive article grid
│   └── NewsCard.jsx / .css # Individual article card
├── App.jsx                 # Root: state management, fetch orchestration
├── App.css                 # App-level layout
└── index.css               # Global reset + CSS design tokens
```

### Data flow

```
App (state)
  ├── fetchAllFeeds()  ←  rssService.js  ←  rss2json proxy  ←  RSS feeds
  ├── → Header         (articleCount, lastUpdated, loading, onRefresh)
  └── → NewsFeed       (articles, sources, activeSourceId, loading, errors)
           └── → NewsCard  (article)
```

---

## News Sources

### Active (Phase 1 — 3 sources)

We deliberately start with 3 well-validated sources rather than all 10 at once.
Reasons:

1. **Reliability validation** — Each RSS feed is fetched via a third-party CORS proxy (`rss2json.com`). Adding feeds one at a time lets us confirm compatibility before scaling.
2. **Reduced failure surface** — 3 feeds → at most 3 things that can break. Errors per source are shown as non-blocking banners.
3. **Quality over quantity** — These 3 cover all key angles (breaking news, consumer/policy, research) with minimal overlap.

| Source         | Focus                              | RSS Feed URL |
|----------------|------------------------------------|--------------|
| TechCrunch AI  | Breaking news, startups, funding   | `https://techcrunch.com/category/artificial-intelligence/feed/` |
| The Verge      | Consumer AI, big tech, policy      | `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` |
| The Decoder    | AI research, business, analysis    | `https://the-decoder.com/feed/` |

### Roadmap (Phase 2 — sources to add next)

Evaluate and add these once Phase 1 is stable:

| Priority | Source              | Focus                        | RSS Feed URL |
|----------|---------------------|------------------------------|--------------|
| High     | Ars Technica        | Deep technical analysis      | `https://feeds.arstechnica.com/arstechnica/technology-lab` |
| High     | MIT News AI         | Academic research            | `https://news.mit.edu/rss/topic/artificial-intelligence2` |
| Medium   | Unite.AI            | Broad AI coverage            | `https://www.unite.ai/feed/` |
| Medium   | AI Magazine         | Enterprise AI trends         | `https://aimagazine.com/rss.xml` |
| Medium   | ScienceDaily AI     | Research papers              | `https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml` |
| Low      | Towards Data Science| ML, data science, tutorials  | `https://towardsdatascience.com/feed` |
| Low      | Hacker News (AI)    | Community-curated discussion | `https://hnrss.org/frontpage?q=AI+machine+learning&points=50` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173`.

---

## How RSS Fetching Works

Browsers block direct cross-origin requests to RSS/XML feeds (CORS policy). We work around this using **[rss2json.com](https://rss2json.com)** — a free service that:

1. Fetches the RSS feed server-side
2. Converts XML → JSON
3. Returns a CORS-friendly JSON response

**API endpoint used:**
```
GET https://api.rss2json.com/v1/api.json?rss_url=<encoded_url>&count=12
```

**Free tier limits:** ~10,000 requests/day per feed — more than sufficient for personal/dev use.

**For production:** Replace with a self-hosted backend (e.g. a small Node.js/Express endpoint that parses RSS server-side) to avoid third-party rate limits and dependencies.

---

## Adding a New Source

1. Open `src/data/sources.js`
2. Add a new entry:

```js
{
  id: 'my-source-id',          // unique kebab-case identifier
  name: 'My Source Name',      // display name
  url: 'https://example.com/feed.xml',  // RSS feed URL
  color: '#ff6b6b',            // hex colour for the source badge
  description: 'Short description',
  website: 'https://example.com',
}
```

3. Validate the RSS feed first:
   ```
   https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fexample.com%2Ffeed.xml
   ```
   Check that `status === "ok"` and `items` is non-empty.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` / `master` | Stable, reviewed code |
| `claude/document-repo-functionalities-*` | Feature development (current) |

---

## Contributing

1. Fork the repo and create a feature branch
2. Make changes, run `npm run lint` to check for issues
3. Open a pull request against `main`

---

## License

MIT
