"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  searchUserByEmail,
  sendFriendRequest,
  decideFriendRequest,
  unblockUser,
} from "@/lib/api/friends";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { UserSummary } from "@/lib/api/types";
import { UserAvatarChip } from "./UserAvatarChip";

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserSearchDialog({ open, onOpenChange }: UserSearchDialogProps) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<UserSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setActionError(null);
    setResult(null);
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email");
      return;
    }
    setPending(true);
    try {
      const r = await searchUserByEmail(email);
      setResult(r);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("No user found with that email");
      } else {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    } finally {
      setPending(false);
    }
  }

  async function onAction() {
    if (!result) return;
    setActionError(null);
    try {
      if (result.relationship_status === "none") {
        await sendFriendRequest(result.id);
      } else if (result.relationship_status === "pending_incoming") {
        await decideFriendRequest(result.id, "accept");
      } else if (result.relationship_status === "blocked_by_me") {
        await unblockUser(result.id);
        // Re-search to refresh status after unblocking
        const r = await searchUserByEmail(email);
        setResult(r);
        qc.invalidateQueries({ queryKey: queryKeys.friends.blocked() });
        return;
      } else {
        return; // disabled state — no-op
      }
      qc.invalidateQueries({ queryKey: queryKeys.friends.requests() });
      qc.invalidateQueries({ queryKey: queryKeys.friends.list() });
      onOpenChange(false);
      setResult(null);
      setEmail("");
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.body || err.message
          : (err as Error).message,
      );
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      setEmail("");
      setResult(null);
      setError(null);
      setActionError(null);
    }
    onOpenChange(o);
  }

  const actionLabel = result ? actionLabelFor(result.relationship_status) : "";
  const actionDisabled =
    !result || actionLabel === "" || isDisabledStatus(result.relationship_status);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>Add by email</DialogTitle>
        <form onSubmit={onSearch} className="flex flex-col gap-3 mt-3">
          <input
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-line px-3 py-2 text-sm"
            autoFocus
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded bg-ink-0 px-3 py-1.5 text-sm text-paper-0 disabled:opacity-50"
              disabled={pending}
            >
              {pending ? "Searching…" : "Search"}
            </button>
          </div>
        </form>
        {error && <div className="mt-3 text-sm text-state-failed">{error}</div>}
        {result && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded border border-line p-3">
            <UserAvatarChip user={result} />
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={onAction}
                disabled={actionDisabled}
                className="rounded bg-ink-0 px-3 py-1 text-xs text-paper-0 disabled:opacity-50"
              >
                {actionLabel || statusLabel(result.relationship_status)}
              </button>
              {actionError && (
                <span className="text-xs text-state-failed">{actionError}</span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function actionLabelFor(status: UserSummary["relationship_status"]): string {
  switch (status) {
    case "none":
      return "Send request";
    case "pending_incoming":
      return "Accept";
    case "blocked_by_me":
      return "Unblock to add";
    default:
      return "";
  }
}

function statusLabel(status: UserSummary["relationship_status"]): string {
  switch (status) {
    case "pending_outgoing":
      return "Pending";
    case "accepted":
      return "Already friends";
    case "blocked_by_them":
      return "Unavailable";
    default:
      return "";
  }
}

function isDisabledStatus(status: UserSummary["relationship_status"]): boolean {
  return (
    status === "pending_outgoing" ||
    status === "accepted" ||
    status === "blocked_by_them"
  );
}
