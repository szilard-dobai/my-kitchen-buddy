# Navigation Restructure Design

## Overview

Simplify site navigation by removing clutter from the main nav and creating a unified settings hub with tabs.

## Problem

- `/settings/telegram` and `/settings/billing` are hard to reach
- Telegram page is completely hidden (not in nav)
- Main nav has links that aren't needed (Extract Recipe is accessible from recipes page)
- No settings hub exists despite `/settings/*` URL pattern

## Navigation Changes

### Header (simplified)

**Left:** Logo → links to `/recipes`

**Right:** Username/email dropdown containing:

- Settings → `/settings`
- Sign out

### Removed from nav

- "My Recipes" link (logo serves this purpose)
- "Extract Recipe" link (accessible from recipes page)
- "Billing" link (moved to settings hub)

## URL Structure

### Before

```
/recipes
/recipes/[id]
/recipes/[id]/edit
/extract
/settings/telegram
/settings/billing
```

### After

```
/recipes
/recipes/[id]
/recipes/[id]/edit
/extract              (unchanged, just not in nav)
/settings             (new hub with tabs)
```

## Settings Page (`/settings`)

Single page with three tabs:

| Tab      | Content                                          |
| -------- | ------------------------------------------------ |
| Profile  | Edit name, email, change password                |
| Telegram | Link/unlink Telegram, instructions, status       |
| Billing  | Subscription status, manage plan, payment method |

Tab selection via query param: `/settings?tab=telegram`

Default tab: Profile

## Files to Change

1. **Delete:** `src/app/(dashboard)/settings/telegram/` directory
2. **Delete:** `src/app/(dashboard)/settings/billing/` directory
3. **Create:** `src/app/(dashboard)/settings/page.tsx` (tabbed hub)
4. **Modify:** `src/components/layout/header.tsx` (user dropdown, remove nav links)
