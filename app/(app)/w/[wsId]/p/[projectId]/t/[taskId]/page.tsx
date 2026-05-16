"use client";
import { use } from "react";
import { TaskListPane } from "@/components/task-detail/TaskListPane";
import { ChatPane } from "@/components/task-detail/ChatPane";
import { RightPanel } from "@/components/task-detail/RightPanel";
import { useTask } from "@/hooks/useTask";
import { useSubscribe } from "@/lib/ws/use-subscribe";

interface PageProps {
  params: Promise<{ wsId: string; projectId: string; taskId: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { wsId, projectId, taskId } = use(params);
  useSubscribe("task", taskId);
  useSubscribe("project", projectId);
  const { data: task } = useTask(taskId);

  return (
    <div className="h-full grid grid-cols-[260px_1fr_320px] min-h-0 overflow-hidden">
      <TaskListPane projectId={projectId} wsId={wsId} activeTaskId={taskId} />
      <ChatPane wsId={wsId} taskId={taskId} task={task} />
      <RightPanel taskId={taskId} />
    </div>
  );
}
