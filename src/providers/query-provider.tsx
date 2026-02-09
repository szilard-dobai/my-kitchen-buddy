"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.skipGlobalError) return;
            const message =
              error instanceof Error ? error.message : "Something went wrong";
            toast.error(message);
          },
          onSuccess: (_data, _variables, _context, mutation) => {
            if (mutation.meta?.skipGlobalSuccess) return;
            toast.success("Changes saved");
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
