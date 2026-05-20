"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchMessages } from "@/lib/api/messages";
import { queryKeys } from "@/lib/api/keys";

export function useTaskMessages(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.messages(taskId),
    queryFn: () => fetchMessages(taskId),
    enabled: !!taskId,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
