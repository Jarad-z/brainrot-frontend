"use client";

import { useState } from "react";
import { FileText, FileCode, Image, Trash2 } from "lucide-react";
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

function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const codeExts = new Set(["ts", "tsx", "js", "jsx", "py", "go", "rs", "md", "json", "yaml", "yml", "toml", "sh"]);
  const imageExts = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"]);
  const cls = "shrink-0 text-ink-2";
  if (imageExts.has(ext)) return <Image size={15} className={cls} />;
  if (codeExts.has(ext)) return <FileCode size={15} className={cls} />;
  return <FileText size={15} className={cls} />;
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
    <li className="group flex items-center gap-3 py-3 px-4 border-b-[1.5px] border-hairline hover:bg-paper-1 transition-colors">
      <FileIcon filename={artifact.filename} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ink-0 truncate" title={artifact.filename}>
          {artifact.filename}
        </span>
        <span className="text-[11px] text-ink-3 font-mono">
          {formatBytes(artifact.size_bytes)} · {relativeTime(artifact.created_at)}
        </span>
      </span>
      {toast && <span className="text-[11px] text-state-failed shrink-0">{toast}</span>}
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={exclude.isPending}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-state-failed hover:bg-state-failed/10 disabled:opacity-30"
        aria-label={m.exclude}
      >
        <Trash2 size={13} />
      </button>
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
