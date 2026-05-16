"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { useProjects } from "@/hooks/useProjects";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceHomePage({ params }: PageProps) {
  const { wsId } = use(params);
  const { data: projects, isPending } = useProjects(wsId);

  return (
    <div className="p-8">
      <header
        className="flex items-start justify-between mb-8 gap-4"
        style={{ display: "grid", gridTemplateColumns: "1fr auto" }}
      >
        <div>
          <h1
            className="text-hero font-display font-extrabold text-ink-0"
            style={{ fontStretch: "88%" }}
          >
            工作区
          </h1>
          <p className="text-ink-2 text-sm mt-2">
            {isPending ? "加载中…" : `${projects?.length ?? 0} 个项目`}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled style={{ minWidth: 160 }}>新建项目</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{messages.shell.writesDisabled}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {isPending && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!isPending && projects && projects.length === 0 && (
        <EmptyState
          title={messages.empty.noProjects.title}
          description={messages.empty.noProjects.description}
        />
      )}

      {!isPending && projects && projects.length > 0 && (
        <ProjectGrid wsId={wsId} projects={projects} />
      )}
    </div>
  );
}
