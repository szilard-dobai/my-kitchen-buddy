# Claude Code Context

## Project Overview

My Kitchen Buddy extracts recipes from social media cooking videos using AI. Users paste a TikTok/Instagram/YouTube URL, and the app fetches the transcript via Supadata API, then uses OpenAI GPT-4o to extract structured recipe data.

## Architecture

### Database Collections (MongoDB)

- `recipes` - User's saved recipes with full recipe data
- `raw_extractions` - Cached AI extraction results keyed by normalized URL (avoids redundant API calls)
- `extractionJobs` - Tracks extraction job status for polling
- `users`, `sessions` - Auth tables managed by better-auth

### Key Flows

**Extraction Flow** (`src/services/extraction/index.ts`):
1. Check `raw_extractions` cache by normalized URL
2. If cached, skip API calls and use cached result
3. If not cached, fetch transcript + metadata from Supadata in parallel
4. Send to OpenAI for extraction, cache the result
5. Create user's recipe from extracted data

**Duplicate Detection** (`src/app/api/extract/route.ts`):
- Before starting extraction, checks if user already has a recipe from this URL
- If yes, returns `existingRecipeId` and frontend redirects to edit page

### URL Normalization

`normalizeUrl()` in `platform-detector.ts` strips all query params and hash fragments for consistent cache lookups.

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login/register pages
│   ├── (dashboard)/       # Protected pages (recipes, extract)
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities (db, auth, session)
├── models/                # Database operations
├── services/extraction/   # Core extraction logic
└── types/                 # TypeScript interfaces
```

## Code Style

- No comments unless absolutely necessary
- ESLint with import ordering (alphabetical, grouped)
- Prettier for formatting
- Type imports use `import type { X }`

## External APIs

- **Supadata** (`api.supadata.ai`): Video transcripts and metadata
- **OpenAI**: GPT-4o for recipe extraction with JSON mode
