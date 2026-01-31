# Next.js Multi-Language Documentation Portal

High-performance documentation portal built with Next.js App Router, ISR, and i18n. Includes a versioned docs system, client-side search, API reference via Swagger UI, and a modern UI with theming.

## Features

✅ Incremental Static Regeneration (ISR) with 60s revalidation  
✅ Locale sub-path routing for en/es/fr/de  
✅ Versioned documentation (v1, v2, v3)  
✅ Sidebar navigation, TOC, and feedback widget  
✅ Code block copy-to-clipboard  
✅ Client-side full-text search (FlexSearch)  
✅ API reference rendered from OpenAPI JSON  
✅ Theme switcher with system preference support  
✅ Dockerized with healthcheck  

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Run with Docker

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and run
docker-compose up --build

# 3. Open the app
http://localhost:3000
```

### Run Locally (without Docker)

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
mandatory/
├── app/                         # Next.js App Router
│   ├── [locale]/
│   │   ├── docs/[version]/[...slug]/page.js
│   │   ├── api-reference/page.js
│   │   └── page.js
│   └── api/search-index/route.js
├── components/                  # UI components
├── lib/                         # i18n and docs utilities
├── _docs/                       # Markdown content (versioned + localized)
├── public/locales/              # i18n JSON files
├── public/openapi.json          # Sample OpenAPI spec
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Routes

- Docs: /en/docs/v1/introduction
- Spanish docs: /es/docs/v1/introduction
- French docs: /fr/docs/v1/introduction
- German docs: /de/docs/v1/introduction
- API Reference: /en/api-reference

## ISR Configuration

Documentation pages and the API reference are statically generated and revalidated every 60 seconds. This balances performance and freshness for frequently updated docs.

## i18n Strategy

Locale-aware routing uses sub-paths for consistent URLs and simple infrastructure. Translation files live in public/locales/{locale}/common.json.

## Search

FlexSearch runs client-side with a small prebuilt index served from /api/search-index, filtered by locale. Results update as the user types.

## Environment Variables

All environment variables are documented in .env.example.

```
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

## Docker

The Dockerfile uses a multi-stage build with Next.js standalone output. The compose file exposes port 3000 and includes a healthcheck at http://localhost:3000.

## Testing Notes

Key elements include required data-testid attributes:
- Sidebar: data-testid="sidebar"
- Search input: data-testid="search-input"
- TOC: data-testid="table-of-contents"
- Theme toggle: data-testid="theme-toggle"
- Language switcher: data-testid="language-switcher"
- Version selector: data-testid="version-selector"
- Feedback widget: data-testid="feedback-input", data-testid="feedback-submit"
- Code blocks: data-testid="code-block", data-testid="copy-code-button"

## License

MIT License
