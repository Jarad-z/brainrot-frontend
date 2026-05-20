"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { useProjects } from "@/hooks/useProjects";
import { useAppStore } from "@/lib/store";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceLayout({ children, params }: LayoutProps) {
  const { wsId } = use(params);
  const router = useRouter();
  const setSelection = useAppStore((s) => s.setSelection);
  const { isPending, error, data } = useProjects(wsId);

  const isAccessDenied =
    error instanceof ApiError && (error.status === 403 || error.status === 404);

  useEffect(() => {
    setSelection({ wsId, projectId: null });
    // Only persist as lastWsId after we've confirmed access — otherwise a
    // cross-workspace approval jump can pin sidebar links to a 403 ws.
    if (!isAccessDenied) {
      localStorage.setItem("brainrot.lastWsId", wsId);
    }
  }, [wsId, setSelection, isAccessDenied]);

  // If the persisted lastWsId points at this denied ws, clear it so the next
  // navigation falls back to a workspace the user is actually a member of.
  useEffect(() => {
    if (isAccessDenied && localStorage.getItem("brainrot.lastWsId") === wsId) {
      localStorage.removeItem("brainrot.lastWsId");
    }
  }, [isAccessDenied, wsId]);

  if (isPending && !data) return <PageSkeleton />;

  if (isAccessDenied) {
    return (
      <ErrorBanner kind="card" variant="error">
        <p className="mb-3">
          {error.status === 403 ? messages.workspace.notMember : messages.workspace.notFound}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem("brainrot.lastWsId");
            router.replace("/onboarding");
          }}
        >
          {messages.workspace.backToOnboarding}
        </Button>
      </ErrorBanner>
    );
  }

  return <>{children}</>;
}
