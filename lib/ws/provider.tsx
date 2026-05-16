"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { WSClient } from "./client";
import { WSClientContext } from "./context";
import { registerHandlers } from "./handlers";

interface WSProviderProps {
  children: React.ReactNode;
}

export function WSProvider({ children }: WSProviderProps) {
  const setWsStatus = useAppStore((s) => s.setWsStatus);
  const queryClient = useQueryClient();

  const client = useMemo(() => {
    const url =
      process.env.NEXT_PUBLIC_WS_URL ??
      (typeof window !== "undefined"
        ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`
        : "");
    return new WSClient(url, setWsStatus);
  }, [setWsStatus]);

  useEffect(() => {
    client.connect();
    // Stub chatUI: T16 will add the real useChatUIStore from @/lib/store/chat-ui;
    // T17 replaces this stub with `() => useChatUIStore.getState()`.
    const unsubscribeHandlers = registerHandlers(
      client,
      queryClient,
      () => ({ recordDecision: () => {} }),
    );
    return () => {
      unsubscribeHandlers();
      client.disconnect();
    };
  }, [client, queryClient]);

  return <WSClientContext.Provider value={client}>{children}</WSClientContext.Provider>;
}
