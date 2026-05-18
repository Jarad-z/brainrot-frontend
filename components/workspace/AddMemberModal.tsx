"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAddMember } from "@/hooks/useAddMember";
import { ApiError } from "@/lib/api/client";
import type { WorkspaceRole } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
  onAdded?: () => void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];

export function AddMemberModal({ open, onOpenChange, wsId, onAdded }: AddMemberModalProps) {
  const m = messages.addMember;
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const mutation = useAddMember(wsId);

  const canSubmit = UUID_RE.test(userId) && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!UUID_RE.test(userId)) {
      setError(m.userIdInvalid);
      return;
    }
    try {
      await mutation.mutateAsync({ user_id: userId, role });
      setUserId("");
      onOpenChange(false);
      onAdded?.();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setError(m.notFound);
        else if (err.status === 409) setError(m.alreadyMember);
        else setError(err.body || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.userIdLabel}</span>
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setError(null);
              }}
              placeholder={m.userIdPlaceholder}
              className={
                error
                  ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm font-mono"
                  : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm font-mono"
              }
            />
            {error ? (
              <span className="text-xs text-state-failed">{error}</span>
            ) : (
              <span className="text-xs text-ink-2">{m.userIdHelp}</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.roleLabel}</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm disabled:opacity-60"
            >
              {mutation.isPending ? m.adding : m.add}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
