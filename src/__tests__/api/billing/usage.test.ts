import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockFreeSubscription,
  mockProSubscription,
  mockSession,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/models/subscription", () => ({
  getOrCreateSubscription: vi.fn(),
}));

describe("/api/billing/usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/billing/usage/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns usage info for free tier user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockFreeSubscription);

      const { GET } = await import("@/app/api/billing/usage/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.used).toBe(5);
      expect(data.limit).toBe(10);
      expect(data.planTier).toBe("free");
      expect(data.currentPeriodEnd).toBeDefined();
    });

    it("returns usage info for pro tier user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockProSubscription);

      const { GET } = await import("@/app/api/billing/usage/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.used).toBe(25);
      expect(data.limit).toBe(100);
      expect(data.planTier).toBe("pro");
      expect(data.currentPeriodEnd).toBeDefined();
    });

    it("creates subscription if none exists", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");

      const newSubscription = {
        ...mockFreeSubscription,
        extractionsUsed: 0,
      };

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(newSubscription);

      const { GET } = await import("@/app/api/billing/usage/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.used).toBe(0);
      expect(data.limit).toBe(10);
      expect(getOrCreateSubscription).toHaveBeenCalledWith(mockSession.user.id);
    });

    it("returns 500 on database error", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const { GET } = await import("@/app/api/billing/usage/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch usage");
    });
  });
});
