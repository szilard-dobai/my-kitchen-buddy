"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpgradePrompt } from "@/components/upgrade/upgrade-prompt";
import { useCreateTag } from "@/hooks/use-tags";
import { trackEvent } from "@/lib/tracking";
import type { PlanTier } from "@/types/subscription";
import { TAG_LIMITS } from "@/types/tag";

const TAG_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (tagId: string) => void;
  currentCount: number;
  planTier: PlanTier;
}

export function CreateTagDialog({
  open,
  onOpenChange,
  onCreated,
  currentCount,
  planTier,
}: CreateTagDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upgradePromptDismissed, setUpgradePromptDismissed] = useState(false);

  const createMutation = useCreateTag();

  const limit = TAG_LIMITS[planTier];
  const atLimit = currentCount >= limit;
  const showUpgradePrompt = open && atLimit && !upgradePromptDismissed;
  const isValidName = name.length > 0 && TAG_NAME_REGEX.test(name);
  const canCreate = isValidName && !atLimit && !createMutation.isPending;

  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    setName(sanitized);
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    setError(null);

    try {
      const newTag = await createMutation.mutateAsync({ name });
      trackEvent("tag_created");
      setName("");
      onOpenChange(false);
      onCreated?.(newTag._id);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create tag");
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setError(null);
      setUpgradePromptDismissed(false);
    }
    onOpenChange(newOpen);
  };

  const handleUpgradePromptChange = (promptOpen: boolean) => {
    if (!promptOpen) {
      setUpgradePromptDismissed(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
          <DialogDescription>
            Add hashtags to categorize your recipes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                #
              </span>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="weeknight"
                maxLength={30}
                disabled={atLimit}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Letters, numbers, and underscores only
            </p>
          </div>

          {atLimit && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/50 p-3 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Tag limit reached ({currentCount}/{limit})
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                <button
                  type="button"
                  onClick={() => setUpgradePromptDismissed(false)}
                  className="underline hover:no-underline"
                >
                  Upgrade to Pro
                </button>{" "}
                for unlimited tags.
              </p>
            </div>
          )}

          <UpgradePrompt
            feature="tags"
            open={showUpgradePrompt}
            onOpenChange={handleUpgradePromptChange}
            currentUsage={currentCount}
            limit={limit}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
