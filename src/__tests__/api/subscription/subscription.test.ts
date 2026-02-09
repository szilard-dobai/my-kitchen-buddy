import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockExhaustedFreeSubscription,
  mockFreeSubscription,
  mockProSubscription,
} from "../../mocks/fixtures";

vi.mock("@/lib/db", () => ({
  default: vi.fn(),
}));

const mockCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
};

describe("Subscription Model", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const getDb = await import("@/lib/db");
    vi.mocked(getDb.default).mockResolvedValue({
      collection: () => mockCollection,
    } as never);
  });

  describe("getSubscription", () => {
    it("returns subscription when found", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        ...mockFreeSubscription,
        _id: { toString: () => mockFreeSubscription._id },
      });

      const { getSubscription } = await import("@/models/subscription");
      const result = await getSubscription("user-123");

      expect(result).toBeDefined();
      expect(result?.userId).toBe("user-123");
      expect(result?.planTier).toBe("free");
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });

    it("returns null when subscription not found", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const { getSubscription } = await import("@/models/subscription");
      const result = await getSubscription("nonexistent-user");

      expect(result).toBeNull();
    });
  });

  describe("getOrCreateSubscription", () => {
    it("returns existing subscription", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        ...mockProSubscription,
        _id: { toString: () => mockProSubscription._id },
      });

      const { getOrCreateSubscription } = await import("@/models/subscription");
      const result = await getOrCreateSubscription("user-123");

      expect(result.planTier).toBe("pro");
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it("creates free tier subscription for new user", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: { toString: () => "new-sub-id" },
      });

      const { getOrCreateSubscription } = await import("@/models/subscription");
      const result = await getOrCreateSubscription("new-user");

      expect(result.planTier).toBe("free");
      expect(result.extractionsLimit).toBe(10);
      expect(result.extractionsUsed).toBe(0);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });
  });

  describe("canUserExtract", () => {
    it("returns true when under limit", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        ...mockFreeSubscription,
        _id: { toString: () => mockFreeSubscription._id },
      });

      const { canUserExtract } = await import("@/models/subscription");
      const result = await canUserExtract("user-123");

      expect(result).toBe(true);
    });

    it("returns false when at limit", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        ...mockExhaustedFreeSubscription,
        _id: { toString: () => mockExhaustedFreeSubscription._id },
      });

      const { canUserExtract } = await import("@/models/subscription");
      const result = await canUserExtract("user-123");

      expect(result).toBe(false);
    });

    it("returns false when over limit", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        ...mockExhaustedFreeSubscription,
        extractionsUsed: 15,
        _id: { toString: () => mockExhaustedFreeSubscription._id },
      });

      const { canUserExtract } = await import("@/models/subscription");
      const result = await canUserExtract("user-123");

      expect(result).toBe(false);
    });

    it("creates subscription if none exists and returns true", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: { toString: () => "new-sub-id" },
      });

      const { canUserExtract } = await import("@/models/subscription");
      const result = await canUserExtract("new-user");

      expect(result).toBe(true);
    });
  });

  describe("incrementExtractionCount", () => {
    it("increments extractionsUsed by 1", async () => {
      const updatedSubscription = {
        ...mockFreeSubscription,
        extractionsUsed: 6,
        _id: { toString: () => mockFreeSubscription._id },
      };
      mockCollection.findOneAndUpdate.mockResolvedValueOnce(
        updatedSubscription,
      );

      const { incrementExtractionCount } =
        await import("@/models/subscription");
      const result = await incrementExtractionCount("user-123");

      expect(result?.extractionsUsed).toBe(6);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: "user-123" },
        expect.objectContaining({
          $inc: { extractionsUsed: 1 },
        }),
        { returnDocument: "after" },
      );
    });

    it("returns null for non-existent user", async () => {
      mockCollection.findOneAndUpdate.mockResolvedValueOnce(null);

      const { incrementExtractionCount } =
        await import("@/models/subscription");
      const result = await incrementExtractionCount("nonexistent-user");

      expect(result).toBeNull();
    });
  });

  describe("resetExtractionCount", () => {
    it("sets extractionsUsed to 0", async () => {
      const resetSubscription = {
        ...mockProSubscription,
        extractionsUsed: 0,
        _id: { toString: () => mockProSubscription._id },
      };
      mockCollection.findOneAndUpdate.mockResolvedValueOnce(resetSubscription);

      const { resetExtractionCount } = await import("@/models/subscription");
      const result = await resetExtractionCount("user-123");

      expect(result?.extractionsUsed).toBe(0);
    });
  });

  describe("findSubscriptionByStripeCustomerId", () => {
    it("returns subscription when found by Stripe customer ID", async () => {
      mockCollection.findOne.mockResolvedValueOnce({
        ...mockProSubscription,
        _id: { toString: () => mockProSubscription._id },
      });

      const { findSubscriptionByStripeCustomerId } =
        await import("@/models/subscription");
      const result = await findSubscriptionByStripeCustomerId("cus_test123");

      expect(result).toBeDefined();
      expect(result?.stripeCustomerId).toBe("cus_test123");
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        stripeCustomerId: "cus_test123",
      });
    });

    it("returns null when Stripe customer not found", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const { findSubscriptionByStripeCustomerId } =
        await import("@/models/subscription");
      const result =
        await findSubscriptionByStripeCustomerId("cus_nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("Plan tier limits", () => {
    it("free tier has 10 extraction limit", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: { toString: () => "new-sub-id" },
      });

      const { getOrCreateSubscription } = await import("@/models/subscription");
      const result = await getOrCreateSubscription("new-user");

      expect(result.extractionsLimit).toBe(10);
    });

    it("pro tier has 100 extraction limit from fixture", () => {
      expect(mockProSubscription.extractionsLimit).toBe(100);
    });
  });
});
