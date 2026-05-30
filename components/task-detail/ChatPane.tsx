"use client";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { AgentTraceModal } from "@/components/chat/AgentTraceModal";
import { TaskHeader } from "./TaskHeader";
import { ThinkingBar } from "./ThinkingBar";
import { useCancelRunHotkey } from "@/hooks/useCancelRunHotkey";
import type { TaskCard } from "@/lib/api/types";

interface ChatPaneProps {
  wsId: string;
  taskId: string;
  projectId: string;
  task: TaskCard | null | undefined;
}

export function ChatPane({ wsId, taskId, projectId, task }: ChatPaneProps) {
  const { running, toast: hotkeyToast } = useCancelRunHotkey(taskId);
  return (
    <section
      className="relative flex flex-col min-h-0 rounded-xl overflow-hidden backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(235,245,253,0.55) 0%, rgba(220,236,250,0.48) 50%, rgba(205,228,247,0.46) 100%)",
        border: "1px solid rgba(220,238,252,0.65)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(20,62,107,0.10), 0 2px 8px rgba(20,62,107,0.12)",
      }}
    >
      <TaskHeader task={task} taskId={taskId} projectId={projectId} />
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <MessageList taskId={taskId} wsId={wsId} />
      </div>
      <ThinkingBar taskId={taskId} wsId={wsId} />
      {hotkeyToast && (
        <div
          role="status"
          className="mx-4 mb-1 self-center rounded-full bg-ink-0/85 px-3 py-1 text-[11.5px] font-medium text-white shadow-sm"
        >
          {hotkeyToast}
        </div>
      )}
      <div className="px-4 pb-3 pt-1">
        <Composer wsId={wsId} taskId={taskId} projectId={projectId} />
        {running && (
          <p className="mt-1 text-center text-[10.5px] text-ink-3">
            按 <kbd className="font-sans font-semibold">Ctrl+C</kbd> 中断当前 run
          </p>
        )}
      </div>
      <AgentTraceModal taskId={taskId} wsId={wsId} />
    </section>
  );
}
