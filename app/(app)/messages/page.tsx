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
    <div className="flex h-full">
      <aside className="w-80 border-r border-line overflow-y-auto">
        <ConversationList />
      </aside>
      <main className="flex flex-1 flex-col">
        {draftPeer ? (
          <>
            <header className="border-b border-line p-3 font-medium">
              {draftPeer.name}
            </header>
            <div className="flex-1 flex items-center justify-center text-sm text-ink-2">
              No messages yet. Say hi.
            </div>
            <ChatComposer peerId={draftPeer.id} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-ink-2">
            Select a conversation
          </div>
        )}
      </main>
    </div>
  );
}
