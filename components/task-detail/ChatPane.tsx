"use client";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { TaskHeader } from "./TaskHeader";
import { ThinkingBar } from "./ThinkingBar";
import type { TaskCard } from "@/lib/api/types";

interface ChatPaneProps {
  wsId: string;
  taskId: string;
  task: TaskCard | null | undefined;
}

export function ChatPane({ wsId, taskId, task }: ChatPaneProps) {
  return (
    <section className="flex flex-col min-h-0 bg-paper-1">
      <TaskHeader task={task} taskId={taskId} />
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <MessageList taskId={taskId} wsId={wsId} />
      </div>
      <ThinkingBar taskId={taskId} wsId={wsId} />
      <div className="border-t-[1.5px] border-hairline bg-paper-0 p-4">
        <Composer wsId={wsId} taskId={taskId} />
      </div>
    </section>
  );
}
