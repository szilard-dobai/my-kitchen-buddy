"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

const STORAGE_KEY = "mkb_lapsed_modal_shown";

function hasSeenModal(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markModalSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Ignore storage errors
  }
}

export function LapsedUserModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenModal()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      trackEvent("lapsed_modal_shown");
    }
  }, []);

  const handleClose = () => {
    markModalSeen();
    setOpen(false);
  };

  const handleUpgradeClick = () => {
    trackEvent("lapsed_modal_cta_click");
    markModalSeen();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Crown className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle>Your Pro subscription has ended</DialogTitle>
          <DialogDescription className="text-center">
            Don&apos;t worry — all your recipes, collections, and tags are safe.
            You can still access everything, but creating new collections and
            tags is limited on the free plan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full" onClick={handleUpgradeClick}>
            <Link href="/settings?tab=billing">
              <Crown className="size-4" />
              Re-subscribe to Pro
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" onClick={handleClose}>
            Continue on Free
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
