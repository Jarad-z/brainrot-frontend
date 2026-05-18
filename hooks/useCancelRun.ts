"use client";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function useCancelRun(taskId: string) {
  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/v1/tasks/${taskId}/cancel-run`, { method: "POST" }),
  });
}
