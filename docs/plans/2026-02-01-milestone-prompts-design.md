# Milestone Prompts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show one-time celebratory prompts when users cross recipe count milestones (5, 10, 25, 50), surfacing Pro features at natural moments.

**Architecture:** Extends existing upgrade prompt infrastructure with milestone-specific types and a new trigger component. Uses localStorage for permanent dismissal tracking.

**Tech Stack:** React, TypeScript, Vitest, localStorage

---

## Task 1: Add milestone helper functions to upgrade-prompts.ts

**Files:**

- Modify: `src/lib/upgrade-prompts.ts`
- Create: `src/__tests__/lib/upgrade-prompts.test.ts`

**Step 1: Write the failing tests**

Create `src/__tests__/lib/upgrade-prompts.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUnseenMilestone, markMilestoneSeen } from "@/lib/upgrade-prompts";

describe("milestone prompts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("getUnseenMilestone", () => {
    it("returns null when recipe count is below first milestone", () => {
      expect(getUnseenMilestone(3)).toBeNull();
    });

    it("returns 5 when user has 5+ recipes and hasn't seen milestone", () => {
      expect(getUnseenMilestone(5)).toBe(5);
      expect(getUnseenMilestone(7)).toBe(5);
    });

    it("returns 10 when user has 10+ recipes and hasn't seen milestone", () => {
      markMilestoneSeen(5);
      expect(getUnseenMilestone(10)).toBe(10);
      expect(getUnseenMilestone(15)).toBe(10);
    });

    it("returns 25 when user has 25+ recipes and hasn't seen milestone", () => {
      markMilestoneSeen(5);
      markMilestoneSeen(10);
      expect(getUnseenMilestone(25)).toBe(25);
    });

    it("returns 50 when user has 50+ recipes and hasn't seen milestone", () => {
      markMilestoneSeen(5);
      markMilestoneSeen(10);
      markMilestoneSeen(25);
      expect(getUnseenMilestone(50)).toBe(50);
    });

    it("returns null when all applicable milestones have been seen", () => {
      markMilestoneSeen(5);
      markMilestoneSeen(10);
      expect(getUnseenMilestone(15)).toBeNull();
    });

    it("returns the lowest unseen milestone", () => {
      expect(getUnseenMilestone(30)).toBe(5);
      markMilestoneSeen(5);
      expect(getUnseenMilestone(30)).toBe(10);
    });
  });

  describe("markMilestoneSeen", () => {
    it("persists milestone to localStorage", () => {
      markMilestoneSeen(5);
      expect(getUnseenMilestone(5)).toBeNull();
    });

    it("can mark multiple milestones", () => {
      markMilestoneSeen(5);
      markMilestoneSeen(10);
      expect(getUnseenMilestone(10)).toBeNull();
      expect(getUnseenMilestone(25)).toBe(25);
    });

    it("handles duplicate marks gracefully", () => {
      markMilestoneSeen(5);
      markMilestoneSeen(5);
      const stored = localStorage.getItem("mkb_seen_milestones");
      expect(JSON.parse(stored!)).toEqual([5]);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/lib/upgrade-prompts.test.ts`
Expected: FAIL - functions not exported

**Step 3: Add milestone types and helper functions**

Add to `src/lib/upgrade-prompts.ts`:

```typescript
// After existing code, add:

const MILESTONES_STORAGE_KEY = "mkb_seen_milestones";
export const MILESTONES = [5, 10, 25, 50] as const;
export type Milestone = (typeof MILESTONES)[number];

function getSeenMilestones(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(MILESTONES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSeenMilestones(milestones: number[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(milestones));
  } catch {
    // Ignore storage errors
  }
}

export function getUnseenMilestone(recipeCount: number): Milestone | null {
  const seen = getSeenMilestones();

  for (const milestone of MILESTONES) {
    if (recipeCount >= milestone && !seen.includes(milestone)) {
      return milestone;
    }
  }

  return null;
}

export function markMilestoneSeen(milestone: number): void {
  const seen = getSeenMilestones();
  if (!seen.includes(milestone)) {
    saveSeenMilestones([...seen, milestone]);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/lib/upgrade-prompts.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/upgrade-prompts.ts src/__tests__/lib/upgrade-prompts.test.ts
git commit -m "feat(milestones): add milestone tracking helper functions"
```

---

## Task 2: Add milestone feature types and configs to UpgradePrompt

**Files:**

- Modify: `src/lib/upgrade-prompts.ts`
- Modify: `src/components/upgrade/upgrade-prompt.tsx`

**Step 1: Add milestone types to UpgradeFeature**

In `src/lib/upgrade-prompts.ts`, update the type:

```typescript
export type UpgradeFeature =
  | "collections"
  | "tags"
  | "bulk_actions"
  | "similar_recipes"
  | "milestone_5"
  | "milestone_10"
  | "milestone_25"
  | "milestone_50";
```

**Step 2: Add milestone configs to FEATURE_CONFIG**

In `src/components/upgrade/upgrade-prompt.tsx`, update the interface and config:

```typescript
interface FeatureConfig {
  title: string;
  description: string;
  getDescription?: (current: number, limit: number, extra?: number) => string;
  celebratoryOnly?: boolean;
}

// Add to FEATURE_CONFIG:
milestone_5: {
  title: "You're building a collection!",
  description: "You've saved 5 recipes. Keep discovering and saving your favorites!",
  celebratoryOnly: true,
},
milestone_10: {
  title: "10 recipes saved!",
  description: "Nice collection! Pro users organize with unlimited tags to categorize recipes by cuisine, mood, or meal type.",
},
milestone_25: {
  title: "25 recipes and counting!",
  description: "Your library is growing! Pro users discover connections with unlimited similar recipe suggestions.",
},
milestone_50: {
  title: "50 recipes — impressive!",
  description: "You're a power user! Pro users organize large collections with unlimited folders to keep everything findable.",
},
```

**Step 3: Update UpgradePrompt to support celebratoryOnly**

In the JSX, replace the DialogFooter:

```typescript
<DialogFooter className="flex-col gap-2 sm:flex-col">
  {config.celebratoryOnly ? (
    <Button className="w-full" onClick={handleDismiss}>
      Got it!
    </Button>
  ) : (
    <>
      <Button asChild className="w-full">
        <Link href="/settings?tab=billing">
          <Crown className="size-4" />
          Upgrade to Pro
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        onClick={handleDismiss}
      >
        Maybe Later
      </Button>
    </>
  )}
</DialogFooter>
```

**Step 4: Run type check and lint**

Run: `npm run lint:types && npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/upgrade-prompts.ts src/components/upgrade/upgrade-prompt.tsx
git commit -m "feat(milestones): add milestone configs to UpgradePrompt"
```

---

## Task 3: Create MilestonePromptTrigger component

**Files:**

- Create: `src/components/upgrade/milestone-prompt-trigger.tsx`
- Create: `src/__tests__/components/upgrade/milestone-prompt-trigger.test.tsx`

**Step 1: Write the failing tests**

Create `src/__tests__/components/upgrade/milestone-prompt-trigger.test.tsx`:

```typescript
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MilestonePromptTrigger } from "@/components/upgrade/milestone-prompt-trigger";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("MilestonePromptTrigger", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("shows milestone prompt when user crosses threshold", () => {
    render(<MilestonePromptTrigger recipeCount={5} planTier="free" />);

    expect(screen.getByText("You're building a collection!")).toBeInTheDocument();
  });

  it("does not show prompt for pro users", () => {
    render(<MilestonePromptTrigger recipeCount={5} planTier="pro" />);

    expect(screen.queryByText("You're building a collection!")).not.toBeInTheDocument();
  });

  it("does not show prompt when below milestone", () => {
    render(<MilestonePromptTrigger recipeCount={3} planTier="free" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show prompt when milestone already seen", () => {
    localStorage.setItem("mkb_seen_milestones", JSON.stringify([5]));

    render(<MilestonePromptTrigger recipeCount={5} planTier="free" />);

    expect(screen.queryByText("You're building a collection!")).not.toBeInTheDocument();
  });

  it("marks milestone as seen when dismissed", async () => {
    const user = userEvent.setup();

    render(<MilestonePromptTrigger recipeCount={5} planTier="free" />);

    await user.click(screen.getByText("Got it!"));

    const stored = localStorage.getItem("mkb_seen_milestones");
    expect(JSON.parse(stored!)).toContain(5);
  });

  it("shows upgrade CTA for non-celebratory milestones", () => {
    localStorage.setItem("mkb_seen_milestones", JSON.stringify([5]));

    render(<MilestonePromptTrigger recipeCount={10} planTier="free" />);

    expect(screen.getByText("10 recipes saved!")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
    expect(screen.getByText("Maybe Later")).toBeInTheDocument();
  });

  it("shows lowest unseen milestone first", () => {
    render(<MilestonePromptTrigger recipeCount={30} planTier="free" />);

    expect(screen.getByText("You're building a collection!")).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/components/upgrade/milestone-prompt-trigger.test.tsx`
Expected: FAIL - module not found

**Step 3: Create the component**

Create `src/components/upgrade/milestone-prompt-trigger.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { UpgradePrompt } from "@/components/upgrade/upgrade-prompt";
import {
  getUnseenMilestone,
  markMilestoneSeen,
  type Milestone,
  type UpgradeFeature,
} from "@/lib/upgrade-prompts";
import type { PlanTier } from "@/types/subscription";

interface MilestonePromptTriggerProps {
  recipeCount: number;
  planTier: PlanTier;
}

export function MilestonePromptTrigger({
  recipeCount,
  planTier,
}: MilestonePromptTriggerProps) {
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (planTier !== "free") return;

    const unseen = getUnseenMilestone(recipeCount);
    if (unseen) {
      setMilestone(unseen);
      setOpen(true);
    }
  }, [recipeCount, planTier]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && milestone) {
      markMilestoneSeen(milestone);
    }
  };

  if (!milestone) return null;

  const feature = `milestone_${milestone}` as UpgradeFeature;

  return (
    <UpgradePrompt
      feature={feature}
      open={open}
      onOpenChange={handleOpenChange}
      skipDismissCheck
    />
  );
}
```

**Step 4: Export Milestone type from upgrade-prompts.ts**

Ensure the type export exists:

```typescript
export type Milestone = (typeof MILESTONES)[number];
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- src/__tests__/components/upgrade/milestone-prompt-trigger.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/upgrade/milestone-prompt-trigger.tsx src/__tests__/components/upgrade/milestone-prompt-trigger.test.tsx
git commit -m "feat(milestones): add MilestonePromptTrigger component"
```

---

## Task 4: Integrate MilestonePromptTrigger into RecipeLibrary

**Files:**

- Modify: `src/components/recipes/recipe-library.tsx`
- Modify: `src/__tests__/components/recipes/recipe-library.test.tsx`

**Step 1: Add a test for milestone prompt integration**

Add to `src/__tests__/components/recipes/recipe-library.test.tsx`:

```typescript
it("shows milestone prompt for free user with 5+ recipes", async () => {
  localStorage.clear();

  renderWithQueryClient(
    <RecipeLibrary
      initialTags={[]}
      initialRecipes={mockRecipeList}
      initialCollections={[]}
      planTier="free"
    />,
  );

  expect(screen.getByText("You're building a collection!")).toBeInTheDocument();
});

it("does not show milestone prompt for pro user", async () => {
  localStorage.clear();

  renderWithQueryClient(
    <RecipeLibrary
      initialTags={[]}
      initialRecipes={mockRecipeList}
      initialCollections={[]}
      planTier="pro"
    />,
  );

  expect(screen.queryByText("You're building a collection!")).not.toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/components/recipes/recipe-library.test.tsx`
Expected: FAIL - milestone prompt not shown

**Step 3: Add MilestonePromptTrigger to RecipeLibrary**

In `src/components/recipes/recipe-library.tsx`:

Add import:

```typescript
import { MilestonePromptTrigger } from "@/components/upgrade/milestone-prompt-trigger";
```

Add component inside the return, after the opening `<div>`:

```typescript
return (
  <div className="flex gap-6">
    <MilestonePromptTrigger recipeCount={recipes.length} planTier={planTier} />
    <aside
    // ... rest of component
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/components/recipes/recipe-library.test.tsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/recipes/recipe-library.tsx src/__tests__/components/recipes/recipe-library.test.tsx
git commit -m "feat(milestones): integrate prompts into recipe library"
```

---

## Task 5: Manual verification and cleanup

**Step 1: Run lint and type check**

Run: `npm run lint && npm run lint:types`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Manual testing checklist**

- [ ] Visit `/recipes` with 5+ recipes as free user → see milestone_5 prompt
- [ ] Dismiss prompt → doesn't show again on refresh
- [ ] Clear localStorage → prompt shows again
- [ ] Visit as Pro user → no milestone prompt shown
- [ ] Test milestone_10, milestone_25, milestone_50 messages appear correctly

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(milestones): address any issues from manual testing"
```
