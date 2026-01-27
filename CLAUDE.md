# Claude Code Context

## Project Overview

My Kitchen Buddy extracts recipes from social media cooking videos using AI. Users paste a TikTok/Instagram/YouTube URL, and the app fetches the transcript via Supadata API, then uses OpenAI GPT-4o to extract structured recipe data including nutrition information.

## Architecture

### Database Collections (MongoDB)

- `recipes` - User's saved recipes with full recipe data
- `raw_extractions` - Cached AI extraction results keyed by normalized URL (avoids redundant API calls)
- `extractionJobs` - Tracks extraction job status for polling (includes optional `telegramChatId`)
- `videoMetadataCaches` - Cached video metadata (title, description, author, thumbnails)
- `authors` - Video creator profiles (username, display name, avatar)
- `telegramLinks` - Links Telegram users to app accounts
- `subscriptions` - User plan tiers, extraction limits, usage tracking, Stripe customer IDs
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

**Telegram Bot Flow** (`src/services/telegram/`):

1. User links account via deep link from /settings (Telegram tab)
2. Sends video URL to bot
3. Bot creates extraction job with `telegramChatId`
4. Extraction service sends status updates and recipe preview via Telegram

**Billing Flow** (`src/app/api/billing/`):

- Free tier: 10 extractions/month
- Pro tier: 100 extractions/month ($5/month or $50/year)
- Stripe checkout at `/api/billing/checkout`
- Customer portal at `/api/billing/portal`
- Usage tracking at `/api/billing/usage`
- Webhook at `/api/billing/webhook` handles subscription events

### URL Normalization

`normalizeUrl()` in `platform-detector.ts` strips all query params and hash fragments for consistent cache lookups.

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login/register pages
│   ├── (dashboard)/       # Protected pages
│   │   ├── extract/       # Video extraction page
│   │   ├── recipes/       # Recipe library and detail pages
│   │   └── settings/      # Unified settings (Profile, Telegram, Billing tabs)
│   └── api/               # API routes
│       ├── extract/       # Recipe extraction
│       ├── billing/       # Stripe checkout, portal, usage, webhook
│       ├── telegram/      # Bot webhook
│       └── telegram-link/ # Account linking
├── components/            # React components
│   ├── layout/           # Header, layout components
│   ├── recipes/          # Recipe-specific components
│   └── ui/               # UI primitives (Radix UI based)
├── lib/                   # Utilities (db, auth, session, stripe, telegram)
├── models/                # Database operations
├── services/
│   ├── extraction/        # Core extraction logic
│   └── telegram/          # Bot handlers and notifications
└── types/                 # TypeScript interfaces
```

## Code Style

- No comments unless absolutely necessary
- ESLint with import ordering (alphabetical, grouped)
- Prettier for formatting
- Type imports use `import type { X }`

## Recipe Data Structure

Recipes include optional nutrition information organized in a nested structure:

```typescript
nutrition?: {
  perServing?: {
    calories, protein, carbs, fat, fiber, sugar, sodium
  };
  per100g?: {
    calories, protein, carbs, fat, fiber, sugar, sodium
  };
}
```

The AI extraction only populates nutrition fields when explicitly mentioned in the video transcript or post description. Users can also manually add/edit nutrition information via the recipe form.

## External APIs

- **Supadata** (`api.supadata.ai`): Video transcripts and metadata
- **OpenAI**: GPT-4o for recipe extraction with JSON mode (extracts nutrition info when mentioned)
- **Telegram Bot API**: Via grammy library, webhook at `/api/telegram/webhook`
- **Stripe**: Subscription billing, webhook at `/api/billing/webhook`
