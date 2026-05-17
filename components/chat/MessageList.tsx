"use client";
import { useRef, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTaskMessages } from "@/hooks/useTaskMessages";
import { useToolPairing } from "@/hooks/useToolPairing";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { useSession } from "@/hooks/useSession";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { EmptyState } from "@/components/common/EmptyState";
import { MessageItem } from "./MessageItem";
import { MessageListSkeleton } from "./parts/MessageListSkeleton";
import { NewMessageFloatingButton } from "./NewMessageFloatingButton";

interface MessageListProps {
  taskId: string;
  wsId: string;
}

export function MessageList({ taskId, wsId }: MessageListProps) {
  const { data: messages = [], isPending } = useTaskMessages(taskId);
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const { data: me } = useSession();
  const pairing = useToolPairing(messages);
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollAnchor = useChatUIStore((s) => s.byTask[taskId]?.scrollAnchor ?? "bottom");
  const setAnchor = useChatUIStore((s) => s.setScrollAnchor);

  const authors = useMemo(() => {
    const users: Record<string, { name: string; handle?: string }> = {};
    if (me) users[me.id] = { name: me.name };
    const ag: Record<string, { name: string; handle: string }> = {};
    for (const a of agents) ag[a.id] = { name: a.name, handle: a.handle };
    return { users, agents: ag };
  }, [me, agents]);

  const visible = useMemo(
    () => messages.filter((m) => !pairing.consumed.has(m.id)),
    [messages, pairing.consumed],
  );

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 8,
    getItemKey: (i) => visible[i]!.id,
  });

  useEffect(() => {
    if (scrollAnchor === "bottom" && visible.length > 0) {
      virtualizer.scrollToIndex(visible.length - 1, { align: "end" });
    }
  }, [visible.length, scrollAnchor, virtualizer]);

  const onScroll = () => {
    const el = parentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAnchor(taskId, atBottom ? "bottom" : "manual");
  };

  if (isPending) return <MessageListSkeleton />;
  if (visible.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          title="还没有人发言"
          description="发一条带 @agent 的消息，把一个 agent 拽进来。"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={parentRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto px-6 py-4"
        aria-live="polite"
        aria-label="任务消息流"
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const msg = visible[vi.index]!;
            const itemPairing =
              msg.parsed.type === "tool_use"
                ? { result: pairing.useToResult.get(msg.parsed.payload.tool_use_id) }
                : { orphan: pairing.orphanResults.has(msg.id) };
            return (
              <div
                key={vi.key}
                ref={virtualizer.measureElement}
                data-index={vi.index}
                style={{ position: "absolute", top: vi.start, left: 0, width: "100%" }}
              >
                <MessageItem msg={msg} pairing={itemPairing} taskId={taskId} authors={authors} />
              </div>
            );
          })}
        </div>
      </div>
      {scrollAnchor === "manual" && (
        <NewMessageFloatingButton
          onClick={() => {
            setAnchor(taskId, "bottom");
            virtualizer.scrollToIndex(visible.length - 1, { align: "end" });
          }}
        />
      )}
    </div>
  );
}
