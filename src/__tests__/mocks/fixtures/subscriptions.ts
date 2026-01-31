import type { Subscription, UsageInfo } from "@/types/subscription";

export const mockFreeSubscription: Subscription = {
  _id: "sub-123",
  userId: "user-123",
  planTier: "free",
  extractionsUsed: 5,
  extractionsLimit: 10,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

export const mockProSubscription: Subscription = {
  _id: "sub-456",
  userId: "user-123",
  planTier: "pro",
  stripeCustomerId: "cus_test123",
  stripeSubscriptionId: "sub_test123",
  extractionsUsed: 25,
  extractionsLimit: 100,
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

export const mockExhaustedFreeSubscription: Subscription = {
  _id: "sub-789",
  userId: "user-123",
  planTier: "free",
  extractionsUsed: 10,
  extractionsLimit: 10,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

export const mockExhaustedProSubscription: Subscription = {
  _id: "sub-101",
  userId: "user-123",
  planTier: "pro",
  stripeCustomerId: "cus_test456",
  stripeSubscriptionId: "sub_test456",
  extractionsUsed: 100,
  extractionsLimit: 100,
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

export const mockFreeUsageInfo: UsageInfo = {
  used: 5,
  limit: 10,
  planTier: "free",
};

export const mockProUsageInfo: UsageInfo = {
  used: 25,
  limit: 100,
  planTier: "pro",
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};
