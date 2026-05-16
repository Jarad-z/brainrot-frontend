"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { useProject } from "@/hooks/useProject";
import { useAppStore } from "@/lib/store";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ wsId: string; projectId: string }>;
}

export default function ProjectLayout({ children, params }: LayoutProps) {
  const { wsId, projectId } = use(params);
  const router = useRouter();
  const setSelection = useAppStore((s) => s.setSelection);
  const { isPending, error } = useProject(projectId);

  useEffect(() => {
    setSelection({ projectId });
  }, [projectId, setSelection]);

  if (isPending) return <PageSkeleton />;

  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return (
      <ErrorBanner kind="card" variant="error">
        <p className="mb-3">
          {error.status === 403 ? messages.project.notMember : messages.project.notFound}
        </p>
        <Button variant="outline" onClick={() => router.replace(`/w/${wsId}`)}>
          {messages.project.backToWorkspace}
        </Button>
      </ErrorBanner>
    );
  }

  return <>{children}</>;
}
