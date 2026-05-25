"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ConversationList } from "../_components/ConversationList";
import { ChatPane } from "../_components/ChatPane";
import { ChatComposer } from "../_components/ChatComposer";
import { listConversations } from "@/lib/api/conversations";
import { queryKeys } from "@/lib/api/keys";

export default function ConversationPage() {
  const { convId } = useParams<{ convId: string }>();
  const convs = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: listConversations,
  });
  const current = convs.data?.find((c) => c.id === convId);
  const peerInitials = current?.peer.name
    ?.split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="y2k-page flex h-full">
      <aside className="w-80 overflow-y-auto shrink-0 y2k-rail">
        <div className="px-4 pt-5 pb-2">
          <h1 className="y2k-hero" style={{ fontSize: 22 }}>
            Messages
          </h1>
          <div className="y2k-hero-sub">your conversations</div>
        </div>
        <ConversationList />
      </aside>
      <main className="flex flex-1 flex-col min-w-0">
        {current ? (
          <>
            <header className="y2k-thread-header flex items-center gap-3">
              <div
                data-y2k-avatar="true"
                className="h-8 w-8 flex items-center justify-center text-xs overflow-hidden shrink-0"
              >
                {current.peer.avatar_url ? (
                  <img
                    src={current.peer.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{peerInitials || "?"}</span>
                )}
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="y2k-thread-header-name truncate">
                  {current.peer.name}
                </span>
                <span className="text-[11px] text-[#6c8acd] font-mono truncate">
                  {current.peer.email}
                </span>
              </div>
            </header>
            <ChatPane convId={convId} peer={current.peer} />
            <ChatComposer peerId={current.peer.id} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <span className="y2k-empty-text">Loading…</span>
          </div>
        )}
      </main>
    </div>
  );
}
