"use client";
import { use, useEffect, useMemo } from "react";
import { TaskListPane } from "@/components/task-detail/TaskListPane";
import { ChatPane } from "@/components/task-detail/ChatPane";
import { RightPanel } from "@/components/task-detail/RightPanel";
import { useTask } from "@/hooks/useTask";
import { useTasks } from "@/hooks/useTasks";
import { useSubscribe } from "@/lib/ws/use-subscribe";

interface PageProps {
  params: Promise<{ wsId: string; projectId: string; taskId: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { wsId, projectId, taskId } = use(params);
  useSubscribe("task", taskId);
  useSubscribe("project", projectId);
  // Prefetch project task list — populates the cache so useTask's fallback
  // can find this task by id when the direct GET 404/405s (BACKEND_GAPS, no
  // single-task endpoint yet). On deep-link navigation, useTask races
  // useTasks(projectId); we trigger both in parallel here.
  const { data: tasks } = useTasks(projectId);
  const { data: task, refetch: refetchTask } = useTask(taskId);

  // If useTask returned null but the project tasks just loaded, retry — the
  // fallback path will now find the task in the project cache.
  const found = useMemo(
    () => tasks?.find((t) => t.id === taskId),
    [tasks, taskId],
  );
  useEffect(() => {
    if (!task && found) refetchTask();
  }, [task, found, refetchTask]);

  return (
    <div className="h-full grid grid-cols-[260px_1fr_320px] min-h-0 overflow-hidden">
      <TaskListPane projectId={projectId} wsId={wsId} activeTaskId={taskId} />
      <ChatPane wsId={wsId} taskId={taskId} task={task ?? found} />
      <RightPanel taskId={taskId} projectId={projectId} />
    </div>
  );
}
