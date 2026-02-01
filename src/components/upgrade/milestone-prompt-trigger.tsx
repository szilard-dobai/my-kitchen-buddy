"use client";

import { useMemo, useState } from "react";
import { UpgradePrompt } from "@/components/upgrade/upgrade-prompt";
import {
  getUnseenMilestone,
  markMilestoneSeen,
  type Milestone,
  type UpgradeFeature,
} from "@/lib/upgrade-prompts";
import type { PlanTier } from "@/types/subscription";

interface MilestonePromptTriggerProps {
  recipeCount: number;
  planTier: PlanTier;
}

export function MilestonePromptTrigger({
  recipeCount,
  planTier,
}: MilestonePromptTriggerProps) {
  const milestone = useMemo((): Milestone | null => {
    if (planTier !== "free") return null;
    return getUnseenMilestone(recipeCount);
  }, [recipeCount, planTier]);

  const [open, setOpen] = useState(!!milestone);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && milestone) {
      markMilestoneSeen(milestone);
    }
  };

  if (!milestone) return null;

  const feature = `milestone_${milestone}` as UpgradeFeature;

  return (
    <UpgradePrompt
      feature={feature}
      open={open}
      onOpenChange={handleOpenChange}
      skipDismissCheck
    />
  );
}
