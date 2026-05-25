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
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="y2k-empty-text">Loading messages…</span>
      </div>
    );
  }

  // Server returns DESC (newest first); display ASC so the bottom is newest.
  const items = (msgs.data ?? []).slice().reverse();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2.5">
      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <span className="y2k-empty-text">
            No messages yet. Say hi to {peer.name}.
          </span>
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
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          "max-w-[70%] whitespace-pre-wrap break-words " +
          (mine ? "y2k-bubble-mine" : "y2k-bubble-peer")
        }
      >
        {msg.body}
      </div>
    </div>
  );
}
