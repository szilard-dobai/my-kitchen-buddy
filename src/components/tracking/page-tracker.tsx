"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking";
import type { TrackingEventType } from "@/lib/tracking";

interface PageTrackerProps {
  event: TrackingEventType;
  metadata?: Record<string, unknown>;
}

export function PageTracker({ event, metadata }: PageTrackerProps) {
  useEffect(() => {
    trackEvent(event, metadata);
  }, [event, metadata]);

  return null;
}
