"use client";

import { use, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/brand/button";
import {
  PageHeader,
  PageTitle,
  PageSub,
  PageHeaderTitleBlock,
  PageHeaderActions,
} from "@/components/brand/page-header";
import { EmptyState } from "@/components/common/EmptyState";
import { TaskGrid } from "@/components/tasks/TaskGrid";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { useProject } from "@/hooks/useProject";
import { useTasks } from "@/hooks/useTasks";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ wsId: string; projectId: string }>;
}

export default function ProjectHomePage({ params }: PageProps) {
  const { wsId, projectId } = use(params);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: project } = useProject(projectId);
  const { data: allTasks, isPending } = useTasks(projectId);
  const tasks = allTasks?.filter((t) => t.status !== "archived");

  return (
    <>
      <div className="p-8 h-full overflow-y-auto">
        <PageHeader editorial>
          <PageHeaderTitleBlock>
            <PageTitle editorial>{project?.name ?? "…"}</PageTitle>
            {project?.description && (
              <PageSub editorial>{project.description}</PageSub>
            )}
          </PageHeaderTitleBlock>
          <PageHeaderActions>
            <Button onClick={() => setCreateOpen(true)}>新建任务</Button>
          </PageHeaderActions>
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
      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        wsId={wsId}
        projectId={projectId}
      />
    </>
  );
}
