"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useInviteByEmail } from "@/hooks/useInviteByEmail";
import { ApiError } from "@/lib/api/client";
import type { WorkspaceRole } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wsId: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];

type FieldError =
  | { kind: "validation"; message: string }
  | { kind: "notFound" }
  | { kind: "alreadyMember" }
  | { kind: "permission" }
  | { kind: "other"; message: string };

export function AddMemberModal({ open, onOpenChange, wsId }: AddMemberModalProps) {
  const m = messages.addMember;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [error, setError] = useState<FieldError | null>(null);
  const [copied, setCopied] = useState(false);
  const mutation = useInviteByEmail(wsId);

  const canSubmit = EMAIL_RE.test(email) && !mutation.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError({ kind: "validation", message: m.emailInvalid });
      return;
    }
    try {
      await mutation.mutateAsync({ email, role });
      setEmail("");
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setError({ kind: "notFound" });
        else if (err.status === 409) setError({ kind: "alreadyMember" });
        else if (err.status === 403) setError({ kind: "permission" });
        else setError({ kind: "other", message: err.body || err.message });
      } else {
        setError({ kind: "other", message: (err as Error).message });
      }
    }
  }

  async function copyRegisterLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/register`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-1">{m.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder={m.emailPlaceholder}
              className={
                error
                  ? "px-3 py-2 border-[1.5px] border-state-failed rounded-sm text-sm"
                  : "px-3 py-2 border-[1.5px] border-hairline rounded-sm text-sm"
              }
            />
            {error?.kind === "validation" && (
              <span className="text-xs text-state-failed">{error.message}</span>
            )}
            {error?.kind === "notFound" && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-state-failed">{m.notFound}</span>
                <button
                  type="button"
                  onClick={copyRegisterLink}
                  className="self-start mt-1 px-2 py-1 border-[1.5px] border-ink-0 rounded-sm text-xs font-semibold"
                >
                  {copied ? m.copied : m.copyRegisterLink}
                </button>
              </div>
            )}
            {error?.kind === "alreadyMember" && (
              <span className="text-xs text-accent-honey">{m.alreadyMember}</span>
            )}
            {error?.kind === "permission" && (
              <span className="text-xs text-state-failed">{m.permissionOwner}</span>
            )}
            {error?.kind === "other" && (
              <span className="text-xs text-state-failed">{error.message}</span>
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
              {mutation.isPending ? m.inviting : m.invite}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
