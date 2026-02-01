import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockProSubscription } from "../../mocks/fixtures";

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock("@/models/subscription", () => ({
  findSubscriptionByStripeCustomerId: vi.fn(),
  updateSubscription: vi.fn(),
  resetExtractionCount: vi.fn(),
}));

describe("/api/billing/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 400 when signature header is missing", async () => {
      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No signature");
    });

    it("returns 400 when signature is invalid", async () => {
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
        throw new Error("Invalid signature");
      });

      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "stripe-signature": "invalid_sig",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid signature");
    });

    it("handles customer.subscription.created event - upgrades to pro", async () => {
      const { stripe } = await import("@/lib/stripe");
      const { findSubscriptionByStripeCustomerId, updateSubscription } =
        await import("@/models/subscription");

      const mockEvent = {
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_test123",
            status: "active",
            items: {
              data: [{ current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 }],
            },
          },
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as never);
      vi.mocked(findSubscriptionByStripeCustomerId).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(updateSubscription).mockResolvedValueOnce(mockProSubscription);

      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify(mockEvent),
        headers: {
          "stripe-signature": "valid_sig",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(updateSubscription).toHaveBeenCalledWith(
        mockProSubscription.userId,
        expect.objectContaining({
          stripeSubscriptionId: "sub_123",
          planTier: "pro",
          extractionsLimit: 100,
        }),
      );
    });

    it("handles customer.subscription.updated event - inactive goes to free", async () => {
      const { stripe } = await import("@/lib/stripe");
      const { findSubscriptionByStripeCustomerId, updateSubscription } =
        await import("@/models/subscription");

      const mockEvent = {
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_test123",
            status: "canceled",
            items: {
              data: [{ current_period_end: Math.floor(Date.now() / 1000) }],
            },
          },
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as never);
      vi.mocked(findSubscriptionByStripeCustomerId).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(updateSubscription).mockResolvedValueOnce(mockProSubscription);

      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify(mockEvent),
        headers: {
          "stripe-signature": "valid_sig",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateSubscription).toHaveBeenCalledWith(
        mockProSubscription.userId,
        expect.objectContaining({
          planTier: "free",
          extractionsLimit: 10,
        }),
      );
    });

    it("handles customer.subscription.deleted event - downgrades to free", async () => {
      const { stripe } = await import("@/lib/stripe");
      const { findSubscriptionByStripeCustomerId, updateSubscription } =
        await import("@/models/subscription");

      const mockEvent = {
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_test123",
          },
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as never);
      vi.mocked(findSubscriptionByStripeCustomerId).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(updateSubscription).mockResolvedValueOnce(mockProSubscription);

      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify(mockEvent),
        headers: {
          "stripe-signature": "valid_sig",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(updateSubscription).toHaveBeenCalledWith(
        mockProSubscription.userId,
        expect.objectContaining({
          stripeSubscriptionId: undefined,
          planTier: "free",
          extractionsLimit: 10,
          currentPeriodEnd: undefined,
        }),
      );
    });

    it("handles invoice.paid event with subscription_cycle - resets extraction count", async () => {
      const { stripe } = await import("@/lib/stripe");
      const { findSubscriptionByStripeCustomerId, resetExtractionCount } =
        await import("@/models/subscription");

      const mockEvent = {
        type: "invoice.paid",
        data: {
          object: {
            customer: "cus_test123",
            billing_reason: "subscription_cycle",
          },
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as never);
      vi.mocked(findSubscriptionByStripeCustomerId).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(resetExtractionCount).mockResolvedValueOnce(mockProSubscription);

      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify(mockEvent),
        headers: {
          "stripe-signature": "valid_sig",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(resetExtractionCount).toHaveBeenCalledWith(mockProSubscription.userId);
    });

    it("ignores invoice.paid for non-subscription_cycle events", async () => {
      const { stripe } = await import("@/lib/stripe");
      const { resetExtractionCount } = await import("@/models/subscription");

      const mockEvent = {
        type: "invoice.paid",
        data: {
          object: {
            customer: "cus_test123",
            billing_reason: "subscription_create",
          },
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as never);

      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify(mockEvent),
        headers: {
          "stripe-signature": "valid_sig",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(resetExtractionCount).not.toHaveBeenCalled();
    });

    it("handles event when subscription record not found (no-op)", async () => {
      const { stripe } = await import("@/lib/stripe");
      const { findSubscriptionByStripeCustomerId, updateSubscription } =
        await import("@/models/subscription");

      const mockEvent = {
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_unknown",
            status: "active",
            items: { data: [{ current_period_end: 1234567890 }] },
          },
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as never);
      vi.mocked(findSubscriptionByStripeCustomerId).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/billing/webhook/route");
      const request = new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify(mockEvent),
        headers: {
          "stripe-signature": "valid_sig",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(updateSubscription).not.toHaveBeenCalled();
    });
  });
});
