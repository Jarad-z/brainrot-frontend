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

  return (
    <div className="flex h-full">
      <aside className="w-80 border-r border-line overflow-y-auto">
        <ConversationList />
      </aside>
      <main className="flex flex-1 flex-col">
        {current ? (
          <>
            <header className="border-b border-line p-3 font-medium">
              {current.peer.name}
            </header>
            <ChatPane convId={convId} peer={current.peer} />
            <ChatComposer peerId={current.peer.id} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-ink-2">
            Loading…
          </div>
        )}
      </main>
    </div>
  );
}
