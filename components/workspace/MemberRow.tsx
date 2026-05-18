"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import { useUpdateMemberRole } from "@/hooks/useUpdateMemberRole";
import { useRemoveMember } from "@/hooks/useRemoveMember";
import { messages } from "@/lib/messages";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/api/types";

interface Props {
  wsId: string;
  member: WorkspaceMember;
  isMe: boolean;
  viewerIsOwner: boolean;
}

const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];

export function MemberRow({ wsId, member, isMe, viewerIsOwner }: Props) {
  const m = messages.members;
  const updateRole = useUpdateMemberRole(wsId);
  const remove = useRemoveMember(wsId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const display = member.name || member.email;
  const canMutate = viewerIsOwner && !isMe;

  function onRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as WorkspaceRole;
    updateRole.mutate(
      { userId: member.user_id, role: next },
      {
        onSuccess: () => {
          setToast(m.roleUpdated);
          setTimeout(() => setToast(null), 1500);
        },
        onError: () => {
          setToast(m.roleUpdateFailed);
          setTimeout(() => setToast(null), 2000);
        },
      },
    );
  }

  function onRemoveConfirm() {
    remove.mutate(member.user_id, {
      onSuccess: () => {
        setToast(m.removed);
        setTimeout(() => setToast(null), 1500);
      },
    });
    setConfirmOpen(false);
  }

  return (
    <li className="flex items-center gap-3 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <div className="flex-1 min-w-0">
        <div className="truncate">
          <strong className="text-ink-0">{display}</strong>
          {isMe && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-paper-2 border border-hairline rounded text-ink-2">
              {m.you}
            </span>
          )}
        </div>
        <div className="text-xs text-ink-2 truncate">{member.email}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isMe ? (
          <span className="text-xs font-mono text-ink-2 px-2 py-1">{member.role}</span>
        ) : (
          <select
            value={member.role}
            onChange={onRoleChange}
            disabled={!canMutate || updateRole.isPending}
            className="px-2 py-1 border-[1.5px] border-hairline rounded-sm text-xs disabled:opacity-50"
            title={!canMutate ? messages.settings.permissionOwner : undefined}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
        {!isMe && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!canMutate || remove.isPending}
            className="px-2 py-1 border-[1.5px] border-state-failed text-state-failed rounded-sm text-xs disabled:opacity-50"
            title={!canMutate ? messages.settings.permissionOwner : undefined}
          >
            {m.remove}
          </button>
        )}
      </div>
      {toast && <span className="text-xs text-ink-2 ml-2">{toast}</span>}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={m.removeConfirmTitle}
        description={m.removeConfirmBody(member.email)}
        confirmLabel={m.removeConfirm}
        cancelLabel={m.removeCancel}
        destructive
        onConfirm={onRemoveConfirm}
      />
    </li>
  );
}
