"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { listConversations } from "@/lib/api/conversations";
import { UserAvatarChip } from "@/components/user/UserAvatarChip";

export function ConversationList() {
  const params = useParams<{ convId?: string }>();
  const activeId = params?.convId;
  const convs = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: listConversations,
  });

  if (convs.isLoading) return <div className="p-3 text-sm text-ink-2">Loading…</div>;
  if ((convs.data ?? []).length === 0) {
    return (
      <div className="p-3 text-sm text-ink-2">
        No conversations yet. Start one from{" "}
        <Link href="/friends" className="underline">
          /friends
        </Link>
        .
      </div>
    );
  }
  return (
    <ul className="flex flex-col">
      {convs.data!.map((c) => {
        const isActive = c.id === activeId;
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className={
                "flex items-start gap-3 px-3 py-2 border-b border-line " +
                (isActive ? "bg-hairline" : "hover:bg-paper-2")
              }
            >
              <UserAvatarChip user={c.peer} size="md" />
              <div className="ml-auto flex flex-col items-end gap-1">
                {c.unread_count > 0 && (
                  <span className="rounded-full bg-ink-0 px-1.5 text-[10px] text-paper-0 leading-tight py-0.5">
                    {c.unread_count}
                  </span>
                )}
                {c.last_message_at && (
                  <span className="text-[10px] text-ink-2">
                    {new Date(c.last_message_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Link>
            {c.last_message_preview && (
              <div className="px-3 pb-2 text-xs text-ink-2 line-clamp-1">
                {c.last_message_preview}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
