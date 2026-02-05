import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dismissPrompt,
  getUnseenMilestone,
  isPromptDismissed,
  markMilestoneSeen,
} from "@/lib/upgrade-prompts";

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

describe("prompt dismissal", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe("isPromptDismissed", () => {
    it("returns false when prompt was never dismissed", () => {
      expect(isPromptDismissed("lapsed_resubscribe")).toBe(false);
    });

    it("returns true when prompt was recently dismissed", () => {
      dismissPrompt("lapsed_resubscribe");
      expect(isPromptDismissed("lapsed_resubscribe")).toBe(true);
    });

    it("returns false when dismissal has expired (after 7 days)", () => {
      dismissPrompt("lapsed_resubscribe");
      expect(isPromptDismissed("lapsed_resubscribe")).toBe(true);

      vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 1);
      expect(isPromptDismissed("lapsed_resubscribe")).toBe(false);
    });

    it("returns true when dismissal is within 7 days", () => {
      dismissPrompt("lapsed_resubscribe");

      vi.advanceTimersByTime(6 * 24 * 60 * 60 * 1000);
      expect(isPromptDismissed("lapsed_resubscribe")).toBe(true);
    });
  });

  describe("dismissPrompt", () => {
    it("persists dismissal to localStorage", () => {
      dismissPrompt("lapsed_resubscribe");
      const stored = localStorage.getItem("mkb_dismissed_prompts");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.lapsed_resubscribe).toBeDefined();
    });

    it("can dismiss multiple different prompts", () => {
      dismissPrompt("lapsed_resubscribe");
      dismissPrompt("collections");
      expect(isPromptDismissed("lapsed_resubscribe")).toBe(true);
      expect(isPromptDismissed("collections")).toBe(true);
    });

    it("updates timestamp when dismissing same prompt again", () => {
      dismissPrompt("lapsed_resubscribe");
      const stored1 = JSON.parse(
        localStorage.getItem("mkb_dismissed_prompts")!,
      );
      const firstTimestamp = stored1.lapsed_resubscribe;

      vi.advanceTimersByTime(1000);
      dismissPrompt("lapsed_resubscribe");

      const stored2 = JSON.parse(
        localStorage.getItem("mkb_dismissed_prompts")!,
      );
      expect(stored2.lapsed_resubscribe).toBeGreaterThan(firstTimestamp);
    });
  });
});
