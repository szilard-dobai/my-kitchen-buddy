"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, type PropsWithChildren } from "react";
import { useSession } from "@/lib/auth-client";

export function SentryUserProvider({ children }: PropsWithChildren) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [session]);

  return children;
}
