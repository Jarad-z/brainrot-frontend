"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ConversationList } from "./_components/ConversationList";
import { ChatComposer } from "./_components/ChatComposer";
import { queryKeys } from "@/lib/api/keys";
import { listConversations } from "@/lib/api/conversations";
import { listFriends } from "@/lib/api/friends";

export default function MessagesIndex() {
  const router = useRouter();
  const sp = useSearchParams();
  const toUserId = sp.get("to");

  const convs = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: listConversations,
  });

  // If ?to=<userId> matches an existing conversation, redirect to the deep link.
  useEffect(() => {
    if (!toUserId || !convs.data) return;
    const match = convs.data.find((c) => c.peer.id === toUserId);
    if (match) router.replace(`/messages/${match.id}`);
  }, [toUserId, convs.data, router]);

  // No ?to= override and the user has at least one conversation — jump to the
  // most recent one so /messages opens directly into the latest thread instead
  // of dumping the user on a "Select a conversation" wall.
  useEffect(() => {
    if (toUserId || !convs.data || convs.data.length === 0) return;
    const newest = [...convs.data].sort((a, b) =>
      (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
    )[0];
    if (newest) router.replace(`/messages/${newest.id}`);
  }, [toUserId, convs.data, router]);

  // For ?to= with no existing conversation, look up the peer in friends so we
  // can render a draft chat header + composer. The first DM lazy-creates the
  // conversation server-side; the WS dm.sent handler will populate the list.
  const draftEligible =
    !!toUserId && !!convs.data && !convs.data.some((c) => c.peer.id === toUserId);
  const friends = useQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: listFriends,
    enabled: draftEligible,
  });
  const draftPeer = draftEligible
    ? friends.data?.find((f) => f.id === toUserId)
    : undefined;

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
        {draftPeer ? (
          <>
            <header className="y2k-thread-header">
              <span className="y2k-thread-header-name">{draftPeer.name}</span>
            </header>
            <div className="flex-1 flex items-center justify-center">
              <span className="y2k-empty-text">No messages yet. Say hi.</span>
            </div>
            <ChatComposer peerId={draftPeer.id} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="y2k-empty-card">
              <div className="y2k-empty-glyph" aria-hidden>
                ✉
              </div>
              <div className="y2k-empty-title">Select a conversation</div>
              <div className="y2k-empty-sub">
                pick a friend on the left to start chatting
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
