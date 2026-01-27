# Pricing Model Design

## Overview

Two-tier freemium model targeting home cooks who save recipes from social media videos.

|                | Free      | Pro                  |
| -------------- | --------- | -------------------- |
| Price          | $0        | $5/month or $50/year |
| Extractions    | 10/month  | 100/month            |
| Recipe library | Unlimited | Unlimited            |
| Telegram bot   | Yes       | Yes                  |

## Tier Details

### Free Tier

- 10 recipe extractions per month
- Unlimited saved recipes in library
- All platforms (TikTok, Instagram, YouTube)
- Telegram bot access
- Resets on billing cycle (1st of month or signup anniversary)

### Pro Tier ($5/month or $50/year)

- 100 recipe extractions per month
- Everything in Free
- Annual option saves ~17% ($10/year)

### When Limits Are Hit

- Free users see upgrade prompt with clear value prop
- Pro users who hit 100 (rare) see message to contact support or wait for reset

## Implementation

### Tracking Usage

- Add `extractionCount` and `extractionResetDate` fields to user record
- Increment on each successful extraction (check `extractionJobs` creation)
- Reset count when `resetDate` passes

### Subscription Management

- Stripe for payment processing (cards, billing cycles, webhooks)
- Store `subscriptionStatus` and `plan` on user (`free` | `pro`)
- Stripe webhooks update user status on payment success/failure/cancellation

### What to Gate

- Only extraction is gated (the expensive operation)
- Recipe library, editing, viewing, Telegram linking remain free
- Cached extractions still count against quota (user still gets value)

### Edge Cases

- Mid-month upgrade: keep current count, raise cap to 100
- Failed payment: grace period (3-5 days), then downgrade to free
- Cancellation: access until end of billing period, then free tier

## User Experience

### Upgrade Prompts

- On extraction page when nearing limit (8/10 used)
- When hitting limit ("You've used all 10 extractions this month")
- Subtle badge in header showing usage (e.g., "7/10")

### Messaging

- Free: "10 free recipes/month"
- Pro: "Save up to 100 recipes/month for $5"
- Annual: "Save $10 with annual billing"

### Settings Page Additions

- Current plan display
- Usage this month (e.g., "7 of 10 extractions used")
- Upgrade/manage subscription button
- Billing history (via Stripe customer portal)

## Out of Scope

- Multiple paid tiers
- Pay-per-extraction credits
- Team/family plans
- Lifetime deals
