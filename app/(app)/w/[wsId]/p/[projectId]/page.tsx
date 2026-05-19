"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/brand/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/brand/tooltip";
import { PageHeader, PageTitle, PageSub } from "@/components/brand/page-header";
import { EmptyState } from "@/components/common/EmptyState";
import { TaskGrid } from "@/components/tasks/TaskGrid";
import { useProject } from "@/hooks/useProject";
import { useTasks } from "@/hooks/useTasks";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ wsId: string; projectId: string }>;
}

export default function ProjectHomePage({ params }: PageProps) {
  const { wsId, projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: tasks, isPending } = useTasks(projectId);

  return (
    <TooltipProvider>
      <div className="p-8 h-full overflow-y-auto">
        <PageHeader>
          <div className="flex-1 min-w-0">
            <PageTitle>{project?.name ?? "…"}</PageTitle>
            {project?.description && <PageSub>{project.description}</PageSub>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled>新建任务</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{messages.shell.writesDisabled}</TooltipContent>
          </Tooltip>
        </PageHeader>

        {isPending && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}

        {!isPending && tasks && tasks.length === 0 && (
          <EmptyState title={messages.empty.noTasks.title} />
        )}

        {!isPending && tasks && tasks.length > 0 && (
          <TaskGrid tasks={tasks} wsId={wsId} projectId={projectId} />
        )}
      </div>
    </TooltipProvider>
  );
}
