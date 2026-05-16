"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { WSClient } from "./client";

interface WSProviderProps {
  children: React.ReactNode;
}

export function WSProvider({ children }: WSProviderProps) {
  const setWsStatus = useAppStore((s) => s.setWsStatus);

  useEffect(() => {
    const url =
      process.env.NEXT_PUBLIC_WS_URL ??
      `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
    const client = new WSClient(url, setWsStatus);
    client.connect();
    return () => client.disconnect();
  }, [setWsStatus]);

  return <>{children}</>;
}
