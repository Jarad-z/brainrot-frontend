"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { getMessages, markConversationRead } from "@/lib/api/conversations";
import { useSession } from "@/hooks/useSession";
import { useBadges } from "@/lib/stores/badges";
import type { UserSummary, DirectMessage } from "@/lib/api/types";

interface ChatPaneProps {
  convId: string;
  peer: UserSummary;
}

export function ChatPane({ convId, peer }: ChatPaneProps) {
  const session = useSession();
  const meId = session.data?.id;
  const msgs = useQuery({
    queryKey: queryKeys.conversations.messages(convId),
    queryFn: () => getMessages(convId, { limit: 50 }),
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark read on mount; mark again on unmount to catch quick-switch users
  // who close the pane before a fresh message lands. Pass `now+5s` to dodge
  // Go time.Now() / Postgres now() microsecond skew (see Task 20 note).
  useEffect(() => {
    const upTo = new Date(Date.now() + 5000).toISOString();
    markConversationRead(convId, upTo).catch(() => {});
    useBadges.getState().clearConversation(convId);
    return () => {
      const fin = new Date(Date.now() + 5000).toISOString();
      markConversationRead(convId, fin).catch(() => {});
    };
  }, [convId]);

  // Scroll to bottom whenever the messages array changes (new send or WS arrival).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.data]);

  if (msgs.isLoading) {
    return <div className="p-4 text-sm text-ink-2">Loading messages…</div>;
  }

  // Server returns DESC (newest first); display ASC so the bottom is newest.
  const items = (msgs.data ?? []).slice().reverse();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {items.length === 0 && (
        <div className="text-center text-sm text-ink-2 py-12">
          No messages yet. Say hi to {peer.name}.
        </div>
      )}
      {items.map((m) => (
        <MessageBubble key={m.id} msg={m} mine={!!meId && m.sender_id === meId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

interface BubbleProps {
  msg: DirectMessage;
  mine: boolean;
}

function MessageBubble({ msg, mine }: BubbleProps) {
  return (
    <div className={mine ? "flex justify-end my-1" : "flex justify-start my-1"}>
      <div
        className={
          "max-w-[70%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words " +
          (mine ? "bg-ink-0 text-paper-0" : "bg-hairline text-ink-0")
        }
      >
        {msg.body}
      </div>
    </div>
  );
}
