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
- `collections` - User recipe collections (name, color, recipeCount)
- `recipe_collections` - Many-to-many relationship between recipes and collections
- `tags` - User tags (name, color, recipeCount)
- `recipe_tags` - Many-to-many relationship between recipes and tags
- `tracking` - Analytics events (page views, recipe interactions, upgrade prompts, etc.)
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
- Usage tracking at `/api/billing/usage` (includes extractions, collections, tags)
- Webhook at `/api/billing/webhook` handles subscription events
- Monthly auto-reset for free tier based on `currentPeriodEnd`

### Plan Tier Limits

| Feature | Free | Pro |
|---------|------|-----|
| Extractions/month | 10 | 100 |
| Collections | 3 | Unlimited |
| Tags | 5 | Unlimited |
| Similar recipes shown | 1 | 9 |

### Collections & Tags

- Users can organize recipes into collections and add custom tags
- Both support colored chips (8 color options)
- Plan tier limits enforced via upgrade prompts
- React Query hooks with optimistic updates (`use-collections.ts`, `use-tags.ts`)

### Similar Recipes (`src/app/api/recipes/[id]/similar/route.ts`)

- Algorithm scores similarity based on ingredient overlap, cuisine matching, and title similarity
- Cuisine family grouping (e.g., Italian/French/Spanish grouped as Mediterranean)
- Results limited by plan tier (Free: 1, Pro: 9)

### Analytics Tracking (`src/lib/tracking/`)

- Client-side `trackEvent()` posts to `/api/tracking`
- Tracks page views, recipe interactions, upgrade prompts, extractions, billing events
- Persistent `deviceId` in localStorage for cross-session tracking
- Captures device type, country, region from Vercel headers

### Milestone Prompts (`src/lib/upgrade-prompts.ts`)

- Celebratory upgrade prompts at 5, 10, 25, 50 saved recipes
- localStorage-based tracking to prevent duplicate prompts
- Only shown to free tier users
- 7-day dismissal window for all upgrade prompts

### Lapsed User Handling (`src/components/upgrade/lapsed-user-*.tsx`)

Lapsed users are detected by: `planTier === "free" && stripeCustomerId exists`

- **LapsedUserModal**: One-time modal shown on first visit after subscription ends
- **LapsedUserBanner**: Dismissible banner on all dashboard pages (7-day dismissal)
- **Graceful degradation**: Lapsed users can still view/edit/delete existing collections and tags, add recipes to existing collections, but cannot create new ones beyond free tier limits
- **Improved messaging**: Create dialogs show "You have 10 collections. Free plan allows 3." instead of just "limit reached"

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
│   │   └── settings/      # Unified settings (Profile, Telegram, Billing, Tags tabs)
│   └── api/               # API routes
│       ├── extract/       # Recipe extraction
│       ├── billing/       # Stripe checkout, portal, usage, webhook
│       ├── collections/   # Collection CRUD + recipe relationships
│       ├── tags/          # Tag CRUD + recipe relationships
│       ├── recipes/       # Recipe CRUD + similar recipes endpoint
│       ├── tracking/      # Analytics events POST/GET
│       ├── telegram/      # Bot webhook
│       └── telegram-link/ # Account linking
├── components/            # React components
│   ├── collections/      # Collection sidebar, dropdown, dialogs
│   ├── layout/           # Header, footer components
│   ├── recipes/          # Recipe cards, filters, similar recipes
│   ├── tags/             # Tag chips, dropdown, dialogs
│   ├── tracking/         # PageTracker, CTALink components
│   ├── upgrade/          # UpgradePrompt, MilestonePromptTrigger, LapsedUserBanner/Modal
│   └── ui/               # UI primitives (Radix UI based)
├── hooks/                 # Custom React hooks
│   ├── use-collections.ts # React Query hooks for collections
│   └── use-tags.ts       # React Query hooks for tags
├── lib/                   # Utilities (db, auth, session, stripe, telegram)
│   ├── tracking/         # Analytics client and types
│   └── upgrade-prompts.ts # Milestone detection and dismissal logic
├── models/                # Database operations
├── services/
│   ├── extraction/        # Core extraction logic
│   └── telegram/          # Bot handlers and notifications
└── types/                 # TypeScript interfaces (includes plan limits)
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

## Key Types

Plan limits are defined in type files for easy reference:

- `PLAN_LIMITS` in `types/subscription.ts` - extraction limits per tier
- `SIMILAR_RECIPES_LIMITS` in `types/subscription.ts` - similar recipes visible per tier
- `COLLECTION_LIMITS` in `types/collection.ts` - collection limits per tier
- `TAG_LIMITS` in `types/tag.ts` - tag limits per tier
