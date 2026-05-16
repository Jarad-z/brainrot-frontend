"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/common/EmptyState";
import { TaskGrid } from "@/components/tasks/TaskGrid";
import { useProject } from "@/hooks/useProject";
import { useTasks } from "@/hooks/useTasks";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectHomePage({ params }: PageProps) {
  const { projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: tasks, isPending } = useTasks(projectId);

  return (
    <div className="p-8">
      <header
        className="flex items-start justify-between mb-8 gap-4"
        style={{ display: "grid", gridTemplateColumns: "1fr auto" }}
      >
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink-0">
            {project?.name ?? "…"}
          </h1>
          {project?.description && <p className="text-ink-2 text-sm mt-2">{project.description}</p>}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled style={{ minWidth: 160 }}>
                  新建任务
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{messages.shell.writesDisabled}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

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

      {!isPending && tasks && tasks.length > 0 && <TaskGrid tasks={tasks} />}
    </div>
  );
}
