"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  dismissPrompt,
  isPromptDismissed,
  type UpgradeFeature,
} from "@/lib/upgrade-prompts";

interface FeatureConfig {
  title: string;
  description: string;
  getDescription?: (current: number, limit: number, extra?: number) => string;
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

  const shouldShow = useMemo(() => {
    if (skipDismissCheck) return true;
    return !isPromptDismissed(feature);
  }, [feature, skipDismissCheck]);

  const handleDismiss = () => {
    dismissPrompt(feature);
    onOpenChange(false);
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
          <Button asChild className="w-full">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
