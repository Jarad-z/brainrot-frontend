"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";

export function useSession() {
  const redirected = useRef(false);
  const result = useQuery({
    queryKey: queryKeys.me(),
    queryFn: auth.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (redirected.current) return;
    if (result.error instanceof ApiError && result.error.status === 401) {
      redirected.current = true;
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace(`/login?next=${next}`);
    }
  }, [result.error]);

  return result;
}
