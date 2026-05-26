"use client";
import type { Asset } from "@/lib/api/types";
import { relativeTime, formatBytes } from "@/lib/format";
import { assetDownloadURL } from "@/lib/api/assets";
import { getDesktopBridge, isDesktop } from "@/lib/desktop";
import { useDeleteAsset } from "@/hooks/useDeleteAsset";
import { messages } from "@/lib/messages";
import { Trash2 } from "lucide-react";

interface AssetRowProps {
  asset: Asset;
}

// Clicking the filename opens the asset:
//   - In Electron: hand the descriptor to the main process, which caches the
//     bytes on disk and calls shell.openPath so the OS default application
//     handles it (PDF reader, image viewer, text editor, ...).
//   - In a plain browser: <a target="_blank"> hits the same-origin download
//     URL with the session cookie attached; the browser then previews or
//     downloads based on Content-Disposition: inline + MIME type.
//
// The trash icon at the end deletes the asset (DB row + blob); the next
// daemon run will pick up the change via reconcile and drop the file from
// the per-project asset cache too.
export function AssetRow({ asset }: AssetRowProps) {
  const m = messages.assets;
  const url = assetDownloadURL(asset.project_id, asset.id);
  const del = useDeleteAsset(asset.project_id);

  function handleClickDesktop(e: React.MouseEvent) {
    const bridge = getDesktopBridge();
    if (!bridge) return; // fall back to the anchor's default behavior
    e.preventDefault();
    void bridge
      .openAsset({
        projectId: asset.project_id,
        assetId: asset.id,
        filename: asset.filename,
        sha256: asset.sha256,
      })
      .then((res) => {
        if (!res.ok && res.error) {
          // Surface a minimal error; the right rail doesn't have a toast
          // host yet so use the browser native alert as a last resort.
          alert(`Couldn't open: ${res.error}`);
        }
      });
  }

  function handleDelete() {
    if (!confirm(m.deleteConfirm(asset.filename))) return;
    del.mutate(asset.id, {
      onError: (err) => alert(`${m.deleteFailed}: ${err.message}`),
    });
  }

  return (
    <li className="flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={isDesktop() ? handleClickDesktop : undefined}
        className="flex-1 truncate hover:underline focus:outline-none"
        title={asset.filename}
      >
        <strong className="text-ink-0">{asset.filename}</strong>
      </a>
      <span className="text-[11px] text-ink-2 shrink-0 font-mono">
        {formatBytes(asset.size_bytes)}
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 ml-1">
        {relativeTime(asset.created_at)}
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={del.isPending}
        aria-label={m.deleteCta}
        title={m.deleteCta}
        className="ml-1 p-1 text-ink-2 hover:text-state-failed disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}
