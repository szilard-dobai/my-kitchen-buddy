const STORAGE_KEY = "mkb_dismissed_prompts";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type UpgradeFeature =
  | "collections"
  | "tags"
  | "bulk_actions"
  | "similar_recipes";

interface DismissedPrompts {
  [feature: string]: number;
}

function getDismissedPrompts(): DismissedPrompts {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveDismissedPrompts(prompts: DismissedPrompts): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch {
    // Ignore storage errors
  }
}

export function isPromptDismissed(feature: UpgradeFeature): boolean {
  const prompts = getDismissedPrompts();
  const dismissedAt = prompts[feature];

  if (!dismissedAt) return false;

  const now = Date.now();
  return now - dismissedAt < DISMISS_DURATION_MS;
}

export function dismissPrompt(feature: UpgradeFeature): void {
  const prompts = getDismissedPrompts();
  prompts[feature] = Date.now();
  saveDismissedPrompts(prompts);
}

export function clearDismissedPrompts(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
