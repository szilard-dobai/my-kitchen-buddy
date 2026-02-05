"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/tracking";
import {
  dismissPrompt,
  isPromptDismissed,
  type UpgradeFeature,
} from "@/lib/upgrade-prompts";

interface FeatureConfig {
  title: string;
  description: string;
  getDescription?: (current: number, limit: number, extra?: number) => string;
  celebratoryOnly?: boolean;
}

const FEATURE_CONFIG: Record<UpgradeFeature, FeatureConfig> = {
  collections: {
    title: "Collection limit reached",
    description: "Upgrade to Pro for unlimited collections.",
    getDescription: (current, limit) =>
      `You've created ${current} of ${limit} collections. Upgrade to Pro for unlimited collections to organize your recipes.`,
  },
  tags: {
    title: "Tag limit reached",
    description: "Upgrade to Pro for unlimited tags.",
    getDescription: (current, limit) =>
      `You've created ${current} of ${limit} tags. Upgrade to Pro for unlimited tags to categorize your recipes.`,
  },
  bulk_actions: {
    title: "Bulk actions are a Pro feature",
    description:
      "Select multiple recipes to add tags, organize into collections, or delete in bulk.",
  },
  similar_recipes: {
    title: "Discover more similar recipes",
    description: "Upgrade to Pro to see all similar recipes.",
    getDescription: (_, __, extra) =>
      `See ${extra} more similar recipes with Pro. Find inspiration from your saved recipes.`,
  },
  milestone_5: {
    title: "You're building a collection!",
    description:
      "You've saved 5 recipes. Keep discovering and saving your favorites!",
    celebratoryOnly: true,
  },
  milestone_10: {
    title: "10 recipes saved!",
    description:
      "Nice collection! Pro users organize with unlimited tags to categorize recipes by cuisine, mood, or meal type.",
  },
  milestone_25: {
    title: "25 recipes and counting!",
    description:
      "Your library is growing! Pro users discover connections with unlimited similar recipe suggestions.",
  },
  milestone_50: {
    title: "50 recipes — impressive!",
    description:
      "You're a power user! Pro users organize large collections with unlimited folders to keep everything findable.",
  },
  lapsed_resubscribe: {
    title: "Welcome back!",
    description:
      "Your Pro subscription has ended, but your recipes and collections are safe. Re-subscribe to unlock unlimited collections, tags, and more.",
  },
};

interface UpgradePromptProps {
  feature: UpgradeFeature;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsage?: number;
  limit?: number;
  extraCount?: number;
  skipDismissCheck?: boolean;
}

export function UpgradePrompt({
  feature,
  open,
  onOpenChange,
  currentUsage,
  limit,
  extraCount,
  skipDismissCheck = false,
}: UpgradePromptProps) {
  const config = FEATURE_CONFIG[feature];
  const hasTrackedShow = useRef(false);

  const shouldShow = useMemo(() => {
    if (skipDismissCheck) return true;
    return !isPromptDismissed(feature);
  }, [feature, skipDismissCheck]);

  useEffect(() => {
    if (open && shouldShow && !hasTrackedShow.current) {
      trackEvent("upgrade_prompt_shown", { feature });
      hasTrackedShow.current = true;
    }
    if (!open) {
      hasTrackedShow.current = false;
    }
  }, [open, shouldShow, feature]);

  const handleDismiss = () => {
    trackEvent("upgrade_prompt_dismissed", { feature });
    dismissPrompt(feature);
    onOpenChange(false);
  };

  const handleUpgradeClick = () => {
    trackEvent("upgrade_prompt_cta_click", { feature });
  };

  const description =
    config.getDescription && currentUsage !== undefined && limit !== undefined
      ? config.getDescription(currentUsage, limit, extraCount)
      : config.getDescription && extraCount !== undefined
        ? config.getDescription(0, 0, extraCount)
        : config.description;

  if (!shouldShow && !skipDismissCheck) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="size-6 text-primary" />
          </div>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {config.celebratoryOnly ? (
            <Button className="w-full" onClick={handleDismiss}>
              Got it!
            </Button>
          ) : (
            <>
              <Button asChild className="w-full" onClick={handleUpgradeClick}>
                <Link href="/settings?tab=billing">
                  <Crown className="size-4" />
                  Upgrade to Pro
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleDismiss}
              >
                Maybe Later
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
