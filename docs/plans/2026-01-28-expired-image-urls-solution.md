# Expired Image URLs Solution

## Overview

Video thumbnails from Supadata API expire after a short time, causing broken images in the recipe grid and detail pages. This solution uses oEmbed APIs and stable YouTube URLs to ensure images always load.

## Problem

- Supadata returns thumbnail URLs that expire (signed URLs with time-limited tokens)
- After a few hours/days, recipe cards show broken images
- Previously attempted Vercel Blob storage but reverted due to legal concerns about re-hosting content

## Solution

Three-pronged approach using platform APIs:

1. **YouTube:** Use permanent `i.ytimg.com` URLs (never expire)
2. **Grid view:** Lazy refresh thumbnails via oEmbed when images fail to load
3. **Detail page:** Embed full video player (always works for public videos)

## Why oEmbed?

- Free, no API keys required (except Instagram)
- Returns fresh thumbnail URLs on demand
- Also provides embed HTML for video players
- Officially supported by all platforms

## Implementation Details

### 1. YouTube Stable Thumbnails

YouTube thumbnails have permanent URLs constructed from video ID:

```
https://i.ytimg.com/vi/{videoId}/hqdefault.jpg
```

**Files:**
- `src/services/extraction/platform-detector.ts` - Added `extractYouTubeVideoId()` and `getYouTubeStableThumbnail()`
- `src/services/extraction/index.ts` - Uses stable URL for YouTube instead of Supadata's

### 2. oEmbed Service

Fetches thumbnail URLs and embed HTML from platform APIs.

**Endpoints:**
- TikTok: `https://www.tiktok.com/oembed?url={url}`
- YouTube: `https://www.youtube.com/oembed?url={url}`
- Instagram: `https://graph.facebook.com/v18.0/instagram_oembed?url={url}&access_token={token}`

**Files:**
- `src/services/oembed.ts` - oEmbed fetching service

### 3. Thumbnail Refresh API

On-demand endpoint to refresh expired thumbnails.

```
POST /api/refresh-thumbnail
Body: { recipeId: string }
Returns: { thumbnailUrl: string }
```

**Flow:**
1. Get recipe from DB
2. For YouTube: construct stable URL
3. For others: call oEmbed API
4. Update recipe's `source.thumbnailUrl` in DB
5. Return new URL to client

**Files:**
- `src/app/api/refresh-thumbnail/route.ts`
- `src/models/recipe.ts` - Added `updateRecipeThumbnail()`

### 4. Client-Side Lazy Refresh

When an image fails to load, automatically fetch a fresh URL.

```typescript
const handleImageError = async () => {
  const res = await fetch('/api/refresh-thumbnail', {
    method: 'POST',
    body: JSON.stringify({ recipeId })
  });
  if (res.ok) {
    const { thumbnailUrl } = await res.json();
    setCurrentThumbnail(thumbnailUrl); // Triggers re-render with new URL
  } else {
    setImageError(true); // Show fallback icon
  }
};
```

**Files:**
- `src/components/recipes/recipe-card.tsx`
- `src/components/recipes/recipe-thumbnail.tsx`

### 5. Video Embed on Detail Page

Instead of a static thumbnail, show the actual video player.

Uses direct iframe embeds (more reliable than oEmbed HTML + scripts):
- TikTok: `https://www.tiktok.com/embed/v2/{videoId}`
- YouTube: `https://www.youtube.com/embed/{videoId}`
- Instagram: `https://www.instagram.com/p/{postId}/embed`

**Files:**
- `src/components/recipes/video-embed.tsx`
- `src/app/(dashboard)/recipes/[id]/page.tsx`

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Deleted video | oEmbed fails → fallback icon shown |
| Private video | oEmbed fails → fallback icon shown |
| Instagram without token | oEmbed skipped → fallback icon shown |
| oEmbed rate limited | Fallback icon shown (rare, APIs are permissive) |

## File Summary

| File | Change |
|------|--------|
| `src/services/extraction/platform-detector.ts` | Added YouTube video ID extraction + stable thumbnail |
| `src/services/extraction/index.ts` | Use stable YouTube URLs during extraction |
| `src/services/oembed.ts` | **New** - oEmbed fetching service |
| `src/app/api/refresh-thumbnail/route.ts` | **New** - Thumbnail refresh endpoint |
| `src/app/api/oembed/route.ts` | **New** - oEmbed proxy endpoint |
| `src/models/recipe.ts` | Added `updateRecipeThumbnail()` |
| `src/components/recipes/recipe-card.tsx` | Lazy refresh on image error |
| `src/components/recipes/recipe-thumbnail.tsx` | Lazy refresh on image error |
| `src/components/recipes/video-embed.tsx` | **New** - Video embed component |
| `src/app/(dashboard)/recipes/[id]/page.tsx` | Video embed instead of thumbnail |

## Future Considerations

- Instagram oEmbed requires Facebook app token for full functionality
- Video embeds show full post UI (no video-only option available from platforms)
- Could add background job to periodically refresh old thumbnails proactively
