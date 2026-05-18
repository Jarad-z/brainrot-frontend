"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import type { Workspace } from "@/lib/api/types";

interface WorkspaceContextValue {
  currentWsId: string | null;
  wsList: Workspace[];
  isLoading: boolean;
  switchTo: (wsId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ wsId?: string }>();
  const router = useRouter();
  const { data: wsList = [], isLoading } = useWorkspaces();

  const currentWsId = params?.wsId ?? null;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      currentWsId,
      wsList,
      isLoading,
      switchTo: (wsId: string) => {
        try {
          localStorage.setItem("brainrot.lastWsId", wsId);
        } catch {
          // localStorage may be unavailable (private mode, etc.) — ignore
        }
        router.push(`/w/${wsId}`);
      },
    }),
    [currentWsId, wsList, isLoading, router],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used inside <WorkspaceProvider>");
  return ctx;
}
