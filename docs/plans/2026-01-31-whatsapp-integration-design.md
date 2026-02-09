# My Kitchen Buddy: WhatsApp Integration & Onboarding Improvements

## Problem Statement

The current flow to save a recipe requires:

1. Copy URL from TikTok/Instagram/YouTube
2. Switch to My Kitchen Buddy app/website
3. Paste URL and submit

This friction causes users to fall back to screenshots, in-app saves, or sending to friends — all of which don't end up in My Kitchen Buddy.

## Goal

Make the "see recipe → save to My Kitchen Buddy" flow as frictionless as possible, especially for mobile users.

---

## Solution: WhatsApp Bot

### Why WhatsApp?

- 2+ billion users globally — far more reach than Telegram
- Native share flow: users already share videos via WhatsApp
- Same architecture as existing Telegram bot
- Meta's Cloud API is accessible for small apps

### User Flow

**Setup (one-time):**

1. User goes to `/settings?tab=whatsapp` (new tab)
2. Clicks "Connect WhatsApp"
3. Opens WhatsApp with pre-filled message to bot number
4. Sends the message to link their account

**Daily use:**

1. User sees recipe video on TikTok/Instagram/YouTube
2. Taps Share → WhatsApp → selects My Kitchen Buddy bot
3. Bot receives URL, starts extraction
4. Bot replies with:
   - Recipe title + thumbnail
   - Quick stats (prep time, servings)
   - "View full recipe" link to their account

### Technical Implementation

**WhatsApp Business API Setup:**

- Use Meta's Cloud API (hosted by Meta, no server infrastructure)
- Register phone number for WhatsApp Business
- Create webhook endpoint at `/api/whatsapp/webhook`
- Verify webhook with Meta's challenge flow

**Database:**

- New `whatsappLinks` collection:
  ```
  {
    _id: ObjectId,
    userId: ObjectId,
    whatsappPhoneNumber: string,  // normalized E.164 format
    linkedAt: Date,
    lastMessageAt: Date
  }
  ```

**API Routes:**

- `POST /api/whatsapp/webhook` — receives messages from WhatsApp
- `GET /api/whatsapp/webhook` — Meta verification challenge
- `POST /api/whatsapp-link/start` — generates linking deep link
- `POST /api/whatsapp-link/complete` — completes account linking

**Message Handling:**

- Parse incoming message for URLs (same regex as Telegram)
- If URL found → create extraction job with `whatsappPhoneNumber`
- Send status updates via WhatsApp (fetching → analyzing → done)
- On completion → send recipe card with link

**Reuse from Telegram:**

- Extraction pipeline (`src/services/extraction/`)
- URL parsing and platform detection
- Job status tracking
- Message formatting patterns

---

## Settings UI

Add new "WhatsApp" tab to `/settings` page (alongside Profile, Telegram, Billing):

**Disconnected state:**

- "Connect WhatsApp" button
- Brief explanation: "Send recipe videos directly from your phone"
- QR code or "Open WhatsApp" button

**Connected state:**

- Shows linked phone number (masked: +1 **\* \*** 1234)
- "Disconnect" button
- Usage tips: "Share any TikTok, Instagram, or YouTube video"

---

## Message Templates

**Linking confirmation:**

```
✓ Your WhatsApp is now linked to My Kitchen Buddy!

Send me any recipe video link from TikTok, Instagram, or YouTube and I'll extract the recipe for you.
```

**Extraction started:**

```
Got it! Extracting recipe from this video...
```

**Extraction complete:**

```
✓ Recipe saved!

🍳 [Recipe Title]
⏱ [Prep time] prep · [Cook time] cook
🍽 [Servings] servings

View full recipe: [link]
```

**Error (not a valid URL):**

```
I couldn't find a video URL in your message.

Send me a link from TikTok, Instagram, or YouTube and I'll extract the recipe.
```

**Error (extraction failed):**

```
Sorry, I couldn't extract a recipe from this video.

This might happen if:
• The video isn't a cooking recipe
• The transcript isn't available
• The platform isn't supported

Try a different video or paste the URL at [app link].
```

---

## WhatsApp Business API Notes

**Requirements:**

- Meta Business account
- Verified business (basic verification, not full Facebook App Review)
- Phone number dedicated to WhatsApp Business
- Webhook endpoint with HTTPS

**Costs:**

- First 1,000 conversations/month: Free
- After that: ~$0.005-0.05 per conversation (varies by country)
- Conversation = 24-hour window from user message

**Rate limits:**

- New business: 1,000 messages/day initially
- Increases with good standing and verification

---

## Files to Create/Modify

**New files:**

- `src/app/api/whatsapp/webhook/route.ts` — webhook handler
- `src/app/api/whatsapp-link/start/route.ts` — initiate linking
- `src/app/api/whatsapp-link/complete/route.ts` — complete linking
- `src/services/whatsapp/index.ts` — WhatsApp service (send messages)
- `src/services/whatsapp/handlers.ts` — message handlers
- `src/models/whatsapp-link.ts` — database operations
- `src/lib/whatsapp.ts` — WhatsApp API client

**Modified files:**

- `src/app/(dashboard)/settings/page.tsx` — add WhatsApp tab
- `src/services/extraction/index.ts` — add WhatsApp notification support
- `src/types/index.ts` — add WhatsApp-related types

---

## Verification Plan

1. **Unit tests:**
   - URL parsing from WhatsApp messages
   - Phone number normalization
   - Message formatting

2. **Integration tests:**
   - Webhook signature verification
   - Account linking flow
   - Extraction job creation from WhatsApp

3. **Manual testing:**
   - Link real WhatsApp account
   - Send TikTok/Instagram/YouTube URLs
   - Verify recipe appears in account
   - Test error cases (invalid URL, failed extraction)

4. **Production checklist:**
   - Meta Business verification complete
   - Webhook URL configured in Meta dashboard
   - Environment variables set (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, etc.)

---

## Future Considerations (Out of Scope)

- Instagram DM bot (same Meta API, can add later)
- Bulk URL paste in web app
- iOS Shortcuts integration
- Browser extension for desktop users
