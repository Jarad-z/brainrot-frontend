"use client";
import { useEffect } from "react";
import type { Scope } from "./types";
import { useWSClient } from "./context";

const refCounts = new Map<string, number>();

export function useSubscribe(scope: Scope, id: string | null | undefined): void {
  const client = useWSClient();
  useEffect(() => {
    if (!id || !client) return;
    const key = `${scope}:${id}`;
    refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
    if (refCounts.get(key) === 1) {
      client.subscribe(scope, id);
    }
    return () => {
      const next = (refCounts.get(key) ?? 1) - 1;
      if (next <= 0) {
        refCounts.delete(key);
        client.unsubscribe(scope, id);
      } else {
        refCounts.set(key, next);
      }
    };
  }, [client, scope, id]);
}
