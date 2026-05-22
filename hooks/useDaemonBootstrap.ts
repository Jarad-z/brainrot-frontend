"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { issueInstallToken } from "@/lib/api/runtimes";
import { queryKeys } from "@/lib/api/keys";
import {
  getDesktopBridge,
  isDesktop,
  type DesktopWorkspaceItem,
} from "@/lib/desktop";

// useDaemonBootstrap drives the per-workspace daemon lifecycle from inside the
// Electron shell. It is a no-op in a plain browser.
//
// Flow on every workspace-set change (initial mount, joined/left a workspace):
//   1. Read the local daemon set via window.brainrot.listDaemons().
//   2. Compare against the user's actual workspace membership (`fetchWorkspaces`).
//   3. For each ws that needs registering, POST /install-tokens (per-member is
//      now allowed) to mint a single-use token.
//   4. Hand the (wsId, token?) list to main via bootstrap (first call) or sync
//      (subsequent calls). Main spawns/kills daemons accordingly.
//
// Tokens are NOT cached anywhere — they go straight from the POST response to
// the IPC call and are discarded. Single-use by server contract.
export function useDaemonBootstrap() {
  const bridge = getDesktopBridge();
  const enabled = isDesktop();
  const didBootstrap = useRef(false);

  const workspacesQuery = useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: fetchWorkspaces,
    enabled,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!bridge || !workspacesQuery.data) return;
    const userWorkspaces = workspacesQuery.data;

    let cancelled = false;
    (async () => {
      try {
        const local = await bridge.listDaemons();
        const localRegistered = new Set(local.registered);
        const items: DesktopWorkspaceItem[] = [];

        for (const ws of userWorkspaces) {
          const item: DesktopWorkspaceItem = { wsId: ws.id, name: ws.slug };
          if (!localRegistered.has(ws.id)) {
            try {
              const t = await issueInstallToken(ws.id);
              item.token = t.token;
            } catch (e) {
              // Skip this workspace — main will not start a daemon without
              // a valid registration. Most likely cause: workspace was
              // archived or the user was demoted between membership fetch
              // and token issuance; the next sync will retry.
              console.warn(`[daemon-bootstrap] issue token for ${ws.id} failed:`, e);
              continue;
            }
          }
          items.push(item);
        }

        if (cancelled) return;

        if (!didBootstrap.current) {
          didBootstrap.current = true;
          await bridge.bootstrap({ workspaces: items });
        } else {
          await bridge.sync({ workspaces: items });
        }
      } catch (e) {
        console.warn("[daemon-bootstrap] failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bridge, workspacesQuery.data]);
}
