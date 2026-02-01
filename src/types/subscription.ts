export type PlanTier = "free" | "pro";

export interface Subscription {
  _id?: string;
  userId: string;
  planTier: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  extractionsUsed: number;
  extractionsLimit: number;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureUsage {
  used: number;
  limit: number;
  atLimit: boolean;
}

export interface UsageInfo {
  used: number;
  limit: number;
  planTier: PlanTier;
  currentPeriodEnd?: Date;
  features: {
    extractions: FeatureUsage;
    collections: FeatureUsage;
    tags: FeatureUsage;
  };
}

export const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 10,
  pro: 100,
};

export const SIMILAR_RECIPES_LIMITS: Record<PlanTier, number> = {
  free: 1,
  pro: 9,
};
