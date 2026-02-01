import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getUnseenMilestone,
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
