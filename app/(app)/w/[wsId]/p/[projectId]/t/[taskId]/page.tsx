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
  const { data: tasks } = useTasks(projectId);
  const { data: task, refetch: refetchTask } = useTask(taskId);

  const found = useMemo(
    () => tasks?.find((t) => t.id === taskId),
    [tasks, taskId],
  );
  useEffect(() => {
    if (!task && found) refetchTask();
  }, [task, found, refetchTask]);

  return (
    <div className="h-full grid grid-cols-[210px_minmax(0,1fr)_280px] gap-2 p-2 min-h-0 overflow-hidden">
      <TaskListPane projectId={projectId} wsId={wsId} activeTaskId={taskId} />
      <ChatPane wsId={wsId} taskId={taskId} projectId={projectId} task={task ?? found} />
      <RightPanel taskId={taskId} projectId={projectId} />
    </div>
  );
}
