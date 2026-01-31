# My Kitchen Buddy: Pro Features & Monetization Design

## Problem Statement

Current Pro tier only offers higher extraction limits (10 free → 100 Pro). This isn't compelling enough to drive conversions. Home cooks who save recipes from videos need **organization features** — not just more extractions.

## Target User

Home cooks who save recipes from cooking videos (TikTok, Instagram, YouTube). Main pain point: "I have recipes everywhere — bookmarks, screenshots, notes — I can't find anything."

## Pricing Philosophy

**Power features for Pro** — Free tier is fully functional but limited; Pro unlocks advanced organization, bulk actions, and smart features. Keep extraction limits as-is (10 free / 100 Pro).

---

## Feature Roadmap

### Phase 1: Quick Wins (1-2 days each)

#### 1. Collections/Folders
- Users create named collections ("Weeknight Dinners", "Meal Prep", "Date Night")
- One recipe can belong to multiple collections
- **Free:** 3 collections max | **Pro:** Unlimited

**Implementation:**
- New `collections` MongoDB collection: `{ _id, userId, name, createdAt }`
- New `recipeCollections` collection for many-to-many: `{ recipeId, collectionId }`
- UI: Collection sidebar/filter on recipes page, "Add to collection" on recipe cards
- Limit enforcement in API routes

#### 2. Custom Tags
- User-defined tags beyond auto-extracted dietary tags
- Color-coded, searchable, filterable
- **Free:** 5 custom tags max | **Pro:** Unlimited

**Implementation:**
- New `tags` collection: `{ _id, userId, name, color, createdAt }`
- Add `customTags: string[]` to recipe documents
- UI: Tag chips on recipe cards, tag management in settings, tag filter in library
- Limit enforcement in API routes

#### 3. Recipe Notes
- Personal notes on any recipe ("Made this, needed more salt", "Kids loved it")
- Timestamped note history
- **Free:** 1 note per recipe | **Pro:** Unlimited notes

**Implementation:**
- New `recipeNotes` collection: `{ _id, recipeId, userId, content, createdAt }`
- UI: Notes section on recipe detail page, expandable note history
- Limit enforcement in API routes

#### 4. Bulk Actions
- Select multiple recipes → add to collection, tag, delete
- **Free:** None | **Pro:** Full bulk editing

**Implementation:**
- Checkbox selection mode on recipes page
- Bulk action toolbar: "Add to collection", "Add tag", "Delete"
- Pro gate check before enabling selection mode

---

### Phase 2: Medium Features (3-7 days each)

#### 5. Shopping Lists
- Generate shopping list from one or multiple recipes
- Auto-consolidates ingredients ("2 recipes need onions → 3 onions total")
- Check off items as you shop
- **Free:** Generate from 1 recipe | **Pro:** Multi-recipe lists + save lists

**Implementation:**
- New `shoppingLists` collection: `{ _id, userId, name, items: [{ ingredient, quantity, unit, checked, sourceRecipeId }], createdAt }`
- Ingredient consolidation logic (match by normalized ingredient name)
- UI: "Add to shopping list" button on recipes, shopping list page, checkable items
- Pro gate for multi-recipe and save functionality

#### 6. Similar Recipes
- "Similar Recipes" section on each recipe detail page
- Shows other saved recipes that are similar (by cuisine, ingredients, author)
- **Free:** Show 1 similar recipe | **Pro:** Show all similar

**Implementation:**
- Similarity scoring function (weighted: same cuisine, overlapping ingredients, same author)
- Query user's recipes, score against current recipe, return top N
- UI: "Similar Recipes" card on recipe detail page with teaser for Pro
- Pro gate for full list

---

### Phase 3: Upgrade Prompts

#### 7. Contextual Upgrade Prompts
Trigger upgrade prompts at moment of friction, not random banners:
- Hit collection limit → "You've created 3 collections. Upgrade to Pro for unlimited."
- Try bulk select as free → "Bulk actions are a Pro feature."
- See similar recipes teaser → "See 2 more similar recipes with Pro."
- Hit tag limit → "You've created 5 tags. Upgrade for unlimited."

**Implementation:**
- Reusable `<UpgradePrompt feature="collections" />` component
- Dismissable, non-blocking modals
- Track which prompts user has seen (don't spam)

#### 8. Enhanced Billing Page
Current billing page just shows extraction usage. Enhance to:
- Show all Pro features with checkmarks (what you get)
- Show current limits vs Pro limits
- Show features user has "maxed out" (3/3 collections used)

**Implementation:**
- Update `/settings?tab=billing` UI
- Query user's current usage across all limited features
- Visual comparison table: Free vs Pro

#### 9. Milestone Prompts
Celebrate user engagement and surface Pro value:
- After 10+ recipes: "You have 15 recipes! Pro users organize with unlimited collections."
- After saving similar recipes: "You saved 3 pasta recipes this week."

**Implementation:**
- Track recipe count milestones
- Show one-time prompts at thresholds (store seen milestones in user prefs)

---

## Database Changes Summary

New collections:
- `collections` — user-created folders
- `recipeCollections` — many-to-many recipe↔collection
- `tags` — user-created custom tags
- `recipeNotes` — notes on recipes
- `shoppingLists` — saved shopping lists

Recipe document changes:
- Add `customTags: string[]` field

Subscription document changes:
- Track feature usage: `collectionsUsed`, `tagsUsed` (or query on demand)

---

## UI Changes Summary

**Recipes Library Page (`/recipes`):**
- Collection filter sidebar
- Tag filter chips
- Bulk selection mode (Pro)
- "Add to collection" and "Add tag" on recipe cards

**Recipe Detail Page (`/recipes/[id]`):**
- Notes section
- Similar recipes section (with Pro teaser)
- "Add to shopping list" button

**New Pages:**
- Shopping lists page (`/shopping-lists`)
- Collection management (could be in settings or inline)
- Tag management (in settings)

**Settings Page:**
- Enhanced billing tab with feature comparison
- Tag management section
- Collection management section (optional)

---

## Verification Plan

For each feature:
1. Create as free user, verify limit enforcement
2. Upgrade to Pro, verify limits removed
3. Downgrade scenario: what happens to data over limit? (keep but read-only)
4. Test upgrade prompts trigger at correct moments
5. Run existing test suite to ensure no regressions

---

## Recommended Build Order

1. **Collections** — highest impact, most requested organization feature
2. **Tags** — complements collections, quick to build
3. **Contextual upgrade prompts** — monetize features 1-2 immediately
4. **Recipe Notes** — simple, adds stickiness
5. **Bulk Actions** — Pro power feature
6. **Enhanced Billing Page** — improve conversion
7. **Shopping Lists** — medium effort, high value
8. **Similar Recipes** — needs recipe volume to be useful
9. **Milestone Prompts** — polish

---

## Out of Scope (Cut)

- Export (PDF, JSON) — rarely drives upgrades
- Meal planning calendar — different product
- Recipe scaling — extraction quality concerns
- Browser extension — users are mobile-first
- Duplicate merge — too complex, replaced by similar recipes view
