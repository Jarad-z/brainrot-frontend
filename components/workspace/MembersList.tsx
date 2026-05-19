"use client";

import { useState } from "react";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useSession } from "@/hooks/useSession";
import { MemberRow } from "./MemberRow";
import { AddMemberModal } from "./AddMemberModal";
import { messages } from "@/lib/messages";

interface Props {
  wsId: string;
}

export function MembersList({ wsId }: Props) {
  const m = messages.settings;
  const mb = messages.members;
  const { data: members, isLoading, isError } = useWorkspaceMembers(wsId);
  const { data: me } = useSession();
  const [addOpen, setAddOpen] = useState(false);

  const viewerRole = members?.find((mem) => mem.user_id === me?.id)?.role;
  const viewerIsOwner = viewerRole === "owner";

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">{m.membersSection}</h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={!viewerIsOwner}
          title={!viewerIsOwner ? m.permissionOwner : undefined}
          className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-xs disabled:opacity-50"
        >
          {m.addMember}
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-ink-2">{mb.loading}</p>
      ) : isError ? (
        <p className="text-sm text-state-failed">{mb.loadError}</p>
      ) : !members || members.length === 0 ? (
        <p className="text-sm text-ink-2">{mb.empty}</p>
      ) : (
        <ul className="border-[1.5px] border-hairline rounded-md overflow-hidden">
          {members.map((member) => (
            <MemberRow
              key={member.user_id}
              wsId={wsId}
              member={member}
              isMe={me?.id === member.user_id}
              viewerIsOwner={viewerIsOwner}
            />
          ))}
        </ul>
      )}
      <AddMemberModal open={addOpen} onOpenChange={setAddOpen} wsId={wsId} />
    </section>
  );
}
