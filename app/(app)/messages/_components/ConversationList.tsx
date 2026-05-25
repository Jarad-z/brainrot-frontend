"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { listConversations } from "@/lib/api/conversations";

export function ConversationList() {
  const params = useParams<{ convId?: string }>();
  const activeId = params?.convId;
  const convs = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: listConversations,
  });

  if (convs.isLoading) {
    return <div className="p-4 text-sm text-[#2c3e5a]">Loading…</div>;
  }
  if ((convs.data ?? []).length === 0) {
    return (
      <div className="p-4 text-sm text-[#2c3e5a]">
        No conversations yet. Start one from{" "}
        <Link href="/friends" className="underline font-semibold text-[#1e3a72]">
          /friends
        </Link>
        .
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2 p-3 list-none m-0">
      {convs.data!.map((c) => {
        const isActive = c.id === activeId;
        const initials = c.peer.name
          .split(" ")
          .map((s) => s[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className={
                "y2k-card y2k-thread flex items-center gap-3" +
                (isActive ? " y2k-thread-active" : "")
              }
            >
              <div
                data-y2k-avatar="true"
                className="h-10 w-10 shrink-0 flex items-center justify-center text-sm overflow-hidden"
              >
                {c.peer.avatar_url ? (
                  <img
                    src={c.peer.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials || "?"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-bold text-[#1e3a72] truncate">
                    {c.peer.name}
                  </span>
                  {c.last_message_at && (
                    <span className="text-[10px] text-[#6c8acd] font-mono shrink-0">
                      {formatStamp(c.last_message_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-[#4a5b80] truncate">
                    {c.last_message_preview || (
                      <span className="italic text-[#6c8acd]">no messages</span>
                    )}
                  </span>
                  {c.unread_count > 0 && (
                    <span className="y2k-unread-pip shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function formatStamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
