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
  const { isPending, error } = useProjects(wsId);

  useEffect(() => {
    setSelection({ wsId, projectId: null });
    localStorage.setItem("brainrot.lastWsId", wsId);
  }, [wsId, setSelection]);

  if (isPending) return <PageSkeleton />;

  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return (
      <ErrorBanner kind="card" variant="error">
        <p className="mb-3">{error.status === 403 ? messages.workspace.notMember : messages.workspace.notFound}</p>
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
