import { getDeviceId } from "./device-id";
import type { DeviceType, TrackingEventType } from "./types";

export type { TrackingEventType } from "./types";

function getDeviceType(): DeviceType {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  } else if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

export function trackEvent(
  type: TrackingEventType,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const deviceId = getDeviceId();
  const deviceType = getDeviceType();

  fetch("/api/tracking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      deviceId,
      deviceType,
      metadata,
    }),
  }).catch(() => {
    // Fire-and-forget, ignore errors
  });
}
