"use client";

import { useState } from "react";
import type { Artifact } from "@/lib/api/types";
import { relativeTime, formatBytes } from "@/lib/format";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import { useSetArtifactExcluded } from "@/hooks/useSetArtifactExcluded";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

interface ArtifactRowProps {
  artifact: Artifact;
  taskId: string;
}

export function ArtifactRow({ artifact, taskId }: ArtifactRowProps) {
  const m = messages.artifacts;
  const exclude = useSetArtifactExcluded(taskId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function onConfirm() {
    exclude.mutate(
      { artifactId: artifact.id, excluded: true },
      {
        onError: (err) => {
          const msg =
            err instanceof ApiError && err.status === 403
              ? m.excludeForbidden
              : m.excludeFailed;
          setToast(msg);
          setTimeout(() => setToast(null), 2000);
        },
      },
    );
  }

  return (
    <li className="group flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate" title={artifact.filename}>
        <strong className="text-ink-0">{artifact.filename}</strong>
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 font-mono">
        {formatBytes(artifact.size_bytes)}
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 ml-1">
        {relativeTime(artifact.created_at)}
      </span>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={exclude.isPending}
        className="px-2 py-0.5 text-[11px] border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-opacity"
      >
        {m.exclude}
      </button>
      {toast && <span className="text-[11px] text-state-failed shrink-0">{toast}</span>}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={m.excludeConfirmTitle}
        description={m.excludeConfirmBody(artifact.filename)}
        confirmLabel={m.excludeConfirm}
        cancelLabel={m.excludeCancel}
        destructive
        onConfirm={onConfirm}
      />
    </li>
  );
}
