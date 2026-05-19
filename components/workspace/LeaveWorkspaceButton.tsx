"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/brand/dialog";
import { useLeaveWorkspace } from "@/hooks/useLeaveWorkspace";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface Props {
  wsId: string;
  wsName: string;
}

export function LeaveWorkspaceButton({ wsId, wsName }: Props) {
  const m = messages.settings;
  const router = useRouter();
  const leave = useLeaveWorkspace(wsId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastOwnerOpen, setLastOwnerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function clearLastWsId() {
    try {
      window.localStorage.removeItem("brainrot.lastWsId");
    } catch {
      // private mode / SSR safety: ignore
    }
  }

  function onConfirm() {
    leave.mutate(undefined, {
      onSuccess: () => {
        clearLastWsId();
        router.replace("/");
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          if (err.status === 409) {
            setLastOwnerOpen(true);
            return;
          }
          if (err.status === 403) {
            clearLastWsId();
            router.replace("/");
            return;
          }
        }
        setToast(m.leaveWsFailed);
        setTimeout(() => setToast(null), 2500);
      },
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={leave.isPending}
          className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm disabled:opacity-50"
        >
          {m.leaveWs}
        </button>
        {toast && <span className="text-xs text-state-failed">{toast}</span>}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={m.leaveWsConfirmTitle}
        description={m.leaveWsConfirmBody(wsName)}
        confirmLabel={m.leaveWsConfirm}
        cancelLabel={m.leaveWsCancel}
        destructive
        onConfirm={onConfirm}
      />
      <Dialog open={lastOwnerOpen} onOpenChange={setLastOwnerOpen}>
        <DialogContent>
          <DialogTitle>{m.leaveWsLastOwnerTitle}</DialogTitle>
          <DialogDescription>{m.leaveWsLastOwner}</DialogDescription>
          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={() => setLastOwnerOpen(false)}
              className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
            >
              {m.leaveWsLastOwnerClose}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
