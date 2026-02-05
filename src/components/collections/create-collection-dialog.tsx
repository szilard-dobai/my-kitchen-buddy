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
import { useCreateCollection } from "@/hooks/use-collections";
import { trackEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import {
  COLLECTION_COLORS,
  COLLECTION_LIMITS,
  DEFAULT_COLLECTION_COLOR,
} from "@/types/collection";
import type { PlanTier } from "@/types/subscription";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (collectionId: string) => void;
  currentCount: number;
  planTier: PlanTier;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreated,
  currentCount,
  planTier,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLLECTION_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [upgradePromptDismissed, setUpgradePromptDismissed] = useState(false);

  const createMutation = useCreateCollection();

  const limit = COLLECTION_LIMITS[planTier];
  const atLimit = currentCount >= limit;
  const overLimit = currentCount > limit;
  const showUpgradePrompt = open && atLimit && !upgradePromptDismissed;
  const canCreate = name.trim().length > 0 && !atLimit && !createMutation.isPending;

  const handleCreate = async () => {
    if (!canCreate) return;

    setError(null);

    try {
      const newCollection = await createMutation.mutateAsync({ name: name.trim(), color });
      trackEvent("collection_created");
      setName("");
      setColor(DEFAULT_COLLECTION_COLOR);
      onOpenChange(false);
      onCreated?.(newCollection._id);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create collection");
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setColor(DEFAULT_COLLECTION_COLOR);
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
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Organize your recipes into collections for easy access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weeknight Dinners"
              maxLength={50}
              disabled={atLimit}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLLECTION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  disabled={atLimit}
                  className={cn(
                    "size-8 rounded-full transition-all cursor-pointer",
                    color === c
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "hover:scale-110",
                    atLimit && "opacity-50 cursor-not-allowed",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {atLimit && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/50 p-3 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {overLimit
                  ? `You have ${currentCount} collections`
                  : `Collection limit reached (${currentCount}/${limit})`}
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                {overLimit ? (
                  <>
                    Free plan allows {limit}.{" "}
                    <button
                      type="button"
                      onClick={() => setUpgradePromptDismissed(false)}
                      className="underline hover:no-underline"
                    >
                      Upgrade to Pro
                    </button>{" "}
                    to create more, or delete some to stay on free.
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setUpgradePromptDismissed(false)}
                      className="underline hover:no-underline"
                    >
                      Upgrade to Pro
                    </button>{" "}
                    for unlimited collections.
                  </>
                )}
              </p>
            </div>
          )}

          <UpgradePrompt
            feature="collections"
            open={showUpgradePrompt}
            onOpenChange={handleUpgradePromptChange}
            currentUsage={currentCount}
            limit={limit}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate}>
            {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
