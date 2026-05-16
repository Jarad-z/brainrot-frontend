"use client";
import { useMemo } from "react";
import { useTaskMessages } from "./useTaskMessages";
import type { ClientMessage } from "@/lib/api/types";

export function useApprovalsHistory(taskId: string): ClientMessage[] {
  const { data: messages = [] } = useTaskMessages(taskId);
  return useMemo(
    () =>
      messages
        .filter((m) => m.parsed.type === "permission_request")
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [messages]
  );
}
