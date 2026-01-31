import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockFreeSubscription,
  mockProSubscription,
  mockSession,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("@/models/subscription", () => ({
  getOrCreateSubscription: vi.fn(),
}));

describe("/api/billing/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/billing/portal/route");
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 when no stripeCustomerId exists", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockFreeSubscription);

      const { POST } = await import("@/app/api/billing/portal/route");
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No billing account found");
    });

    it("returns portal URL for subscribed user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValueOnce({
        url: "https://billing.stripe.com/portal_session",
      } as never);

      const { POST } = await import("@/app/api/billing/portal/route");
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe("https://billing.stripe.com/portal_session");
      expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: mockProSubscription.stripeCustomerId,
        return_url: expect.stringContaining("/settings/billing"),
      });
    });

    it("returns 500 when Stripe portal creation fails", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(stripe.billingPortal.sessions.create).mockRejectedValueOnce(
        new Error("Stripe error"),
      );

      const { POST } = await import("@/app/api/billing/portal/route");
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create portal session");
    });
  });
});
