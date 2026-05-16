"use client";

import { useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "@/lib/api/client";
import { useAppStore } from "@/lib/store";

function buildClient(): QueryClient {
  // eslint-disable-next-line prefer-const
  let qc: QueryClient;
  const cache = new QueryCache({
    onError: (err) => {
      if (!(err instanceof ApiError)) return;
      if (err.status === 401 && typeof window !== "undefined") {
        qc.clear();
        useAppStore.getState().reset();
        const next = encodeURIComponent(location.pathname + location.search);
        if (!location.pathname.startsWith("/login") && !location.pathname.startsWith("/register")) {
          location.replace(`/login?next=${next}`);
        }
      }
    },
  });
  qc = new QueryClient({
    queryCache: cache,
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
  });
  return qc;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(buildClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
