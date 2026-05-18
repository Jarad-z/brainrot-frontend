"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { InstallToken } from "@/lib/api/types";
import { messages } from "@/lib/messages";

interface InstallTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: InstallToken | null;
}

export function InstallTokenModal({ open, onOpenChange, token }: InstallTokenModalProps) {
  const m = messages.installToken;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setCopiedKey(null);
  }, [open]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
    } catch {
      setCopiedKey(null);
    }
  }

  if (!token) return null;

  const snippet = `brainrot-daemon register --token ${token.token}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.title}</DialogTitle>
        <div className="mt-3 p-3 bg-state-failed/10 border-[1.5px] border-state-failed/40 rounded-sm text-xs">
          {m.warning}
        </div>

        <label className="block mt-4">
          <span className="text-xs font-semibold text-ink-1">{m.tokenLabel}</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-paper-2 border border-hairline rounded text-xs font-mono break-all">
              {token.token}
            </code>
            <button
              type="button"
              onClick={() => copy(token.token, "token")}
              className="px-3 py-2 text-xs font-semibold border-[1.5px] border-ink-0 rounded-sm"
            >
              {copiedKey === "token" ? m.copied : m.copy}
            </button>
          </div>
        </label>

        <label className="block mt-4">
          <span className="text-xs font-semibold text-ink-1">{m.snippetLabel}</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-paper-2 border border-hairline rounded text-xs font-mono break-all">
              {snippet}
            </code>
            <button
              type="button"
              onClick={() => copy(snippet, "snippet")}
              className="px-3 py-2 text-xs font-semibold border-[1.5px] border-ink-0 rounded-sm"
            >
              {copiedKey === "snippet" ? m.copied : m.copy}
            </button>
          </div>
        </label>

        <p className="text-xs text-ink-2 mt-4">
          {m.expiresPrefix} {token.expires_at}
        </p>

        <div className="flex justify-end mt-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 bg-ink-0 text-paper-0 border-[1.5px] border-ink-0 rounded-sm font-semibold text-sm"
          >
            {m.close}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
