"use client";
import { useRef, useEffect, useMemo, useState } from "react";
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
import type { ClientMessage } from "@/lib/api/types";

// Hook/session metadata from claude CLI that should not be shown in the chat stream.
const SYSTEM_NOISE_SUBTYPES = new Set([
  "hook_started",
  "hook_response",
  "init",
  "notification",
]);

function authorKey(m: ClientMessage): string {
  if (m.author_agent_id) return `agent:${m.author_agent_id}`;
  if (m.author_user_id) return `user:${m.author_user_id}`;
  return `sys:${m.parsed.type}`;
}

function isSystemNoise(msg: ClientMessage): boolean {
  if (msg.parsed.type !== "system") return false;
  const payload = msg.parsed.payload;
  if (payload && typeof payload === "object") {
    const subtype = (payload as Record<string, unknown>).subtype;
    if (typeof subtype === "string" && SYSTEM_NOISE_SUBTYPES.has(subtype)) return true;
  }
  return false;
}

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
    () => messages.filter((m) => !pairing.consumed.has(m.id) && !isSystemNoise(m)),
    [messages, pairing.consumed],
  );

  const isFirstInGroup = useMemo(
    () => visible.map((m, i) => i === 0 || authorKey(visible[i - 1]!) !== authorKey(m)),
    [visible],
  );

  const prevCountRef = useRef(visible.length);
  const [newFromIndex, setNewFromIndex] = useState(visible.length);
  // Count of messages when the user last left the bottom — new messages are
  // those that arrived after this point while the user is scrolled up.
  const countWhenLeftBottomRef = useRef<number | null>(null);
  useEffect(() => {
    if (visible.length > prevCountRef.current) {
      setNewFromIndex(prevCountRef.current);
    }
    prevCountRef.current = visible.length;
  }, [visible.length]);

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
    if (atBottom) {
      countWhenLeftBottomRef.current = null;
      setAnchor(taskId, "bottom");
    } else {
      if (countWhenLeftBottomRef.current === null) {
        countWhenLeftBottomRef.current = visible.length;
      }
      setAnchor(taskId, "manual");
    }
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
        className="h-full overflow-y-auto px-8 py-6"
        aria-live="polite"
        aria-label="任务消息流"
      >
        <div
          className="mx-auto max-w-3xl"
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
                <MessageItem
                  msg={msg}
                  pairing={itemPairing}
                  taskId={taskId}
                  authors={authors}
                  isNew={scrollAnchor === "bottom" && vi.index >= newFromIndex}
                  isFirstInGroup={isFirstInGroup[vi.index] ?? true}
                />
              </div>
            );
          })}
        </div>
      </div>
      {scrollAnchor === "manual" &&
        countWhenLeftBottomRef.current !== null &&
        visible.length > countWhenLeftBottomRef.current && (
          <NewMessageFloatingButton
            onClick={() => {
              countWhenLeftBottomRef.current = null;
              setAnchor(taskId, "bottom");
              virtualizer.scrollToIndex(visible.length - 1, { align: "end" });
            }}
          />
        )}
    </div>
  );
}
