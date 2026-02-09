"use client";

import { Crown, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { dismissPrompt, isPromptDismissed } from "@/lib/upgrade-prompts";

export function LapsedUserBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isPromptDismissed("lapsed_resubscribe")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      trackEvent("lapsed_banner_shown");
    }
  }, []);

  const handleDismiss = () => {
    trackEvent("lapsed_banner_dismissed");
    dismissPrompt("lapsed_resubscribe");
    setVisible(false);
  };

  const handleUpgradeClick = () => {
    trackEvent("lapsed_banner_cta_click");
  };

  if (!visible) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Crown className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200 truncate">
              <span className="font-medium">
                Your Pro subscription has ended.
              </span>{" "}
              <span className="hidden sm:inline">
                Your data is safe, but some features are limited.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleUpgradeClick}
            >
              <Link href="/settings?tab=billing">Re-subscribe</Link>
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
