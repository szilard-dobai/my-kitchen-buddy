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
    customers: {
      create: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  STRIPE_PRICES: {
    pro_monthly: "price_monthly_test",
    pro_yearly: "price_yearly_test",
  },
}));

vi.mock("@/models/subscription", () => ({
  getOrCreateSubscription: vi.fn(),
  updateSubscription: vi.fn(),
}));

describe("/api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceType: "monthly" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for invalid priceType", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(mockSession);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceType: "invalid" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid price type");
    });

    it("returns 400 when priceType is missing", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(mockSession);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid price type");
    });

    it("creates checkout session for monthly plan", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({
        url: "https://checkout.stripe.com/session_monthly",
      } as never);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceType: "monthly" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe("https://checkout.stripe.com/session_monthly");
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: "price_monthly_test", quantity: 1 }],
        }),
      );
    });

    it("creates checkout session for yearly plan", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({
        url: "https://checkout.stripe.com/session_yearly",
      } as never);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceType: "yearly" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe("https://checkout.stripe.com/session_yearly");
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: "price_yearly_test", quantity: 1 }],
        }),
      );
    });

    it("creates new Stripe customer if none exists", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription, updateSubscription } = await import(
        "@/models/subscription"
      );
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockFreeSubscription);
      vi.mocked(stripe.customers.create).mockResolvedValueOnce({
        id: "cus_new_customer",
      } as never);
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({
        url: "https://checkout.stripe.com/session",
      } as never);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceType: "monthly" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: mockSession.user.email,
        name: mockSession.user.name,
        metadata: { userId: mockSession.user.id },
      });
      expect(updateSubscription).toHaveBeenCalledWith(mockSession.user.id, {
        stripeCustomerId: "cus_new_customer",
      });
    });

    it("uses existing stripeCustomerId if present", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({
        url: "https://checkout.stripe.com/session",
      } as never);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceType: "monthly" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(stripe.customers.create).not.toHaveBeenCalled();
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: mockProSubscription.stripeCustomerId,
        }),
      );
    });

    it("returns 500 when Stripe API fails", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { stripe } = await import("@/lib/stripe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(mockProSubscription);
      vi.mocked(stripe.checkout.sessions.create).mockRejectedValueOnce(
        new Error("Stripe error"),
      );

      const { POST } = await import("@/app/api/billing/checkout/route");
      const request = new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceType: "monthly" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create checkout session");
    });
  });
});
