"use client";
import { useMemo } from "react";
import { pairToolMessages } from "@/lib/chat/pair-tool-messages";
import type { ClientMessage } from "@/lib/api/types";

export function useToolPairing(messages: ReadonlyArray<ClientMessage>) {
  return useMemo(() => pairToolMessages(messages), [messages]);
}
