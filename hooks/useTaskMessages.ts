"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMessages } from "@/lib/api/messages";
import { queryKeys } from "@/lib/api/keys";

export function useTaskMessages(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.messages(taskId),
    queryFn: () => fetchMessages(taskId),
    enabled: !!taskId,
  });
}
