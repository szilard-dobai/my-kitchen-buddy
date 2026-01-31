"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="mb-6 text-muted-foreground">
        An unexpected error occurred. We&apos;ve been notified.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
