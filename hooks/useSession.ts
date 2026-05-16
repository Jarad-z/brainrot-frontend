"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";

export function useSession() {
  const router = useRouter();
  const result = useQuery({
    queryKey: queryKeys.me(),
    queryFn: auth.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (result.error instanceof ApiError && result.error.status === 401) {
      const next = encodeURIComponent(location.pathname + location.search);
      router.replace(`/login?next=${next}`);
    }
  }, [result.error, router]);

  return result;
}
