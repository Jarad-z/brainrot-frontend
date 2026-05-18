"use client";
import type { Asset } from "@/lib/api/types";
import { relativeTime, formatBytes } from "@/lib/format";

interface AssetRowProps {
  asset: Asset;
}

export function AssetRow({ asset }: AssetRowProps) {
  return (
    <li className="flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate" title={asset.filename}>
        <strong className="text-ink-0">{asset.filename}</strong>
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 font-mono">
        {formatBytes(asset.size_bytes)}
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 ml-1">
        {relativeTime(asset.created_at)}
      </span>
    </li>
  );
}
