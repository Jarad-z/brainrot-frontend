/* eslint-disable camelcase -- snake_case identifiers come from backend wire format */
"use client";
import type { Artifact } from "@/lib/api/types";
import { relativeTime } from "@/lib/format";

interface ArtifactRowProps {
  artifact: Artifact;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ArtifactRow({ artifact }: ArtifactRowProps) {
  return (
    <li className="flex items-center gap-2 py-2 px-3 border-b-[1.5px] border-hairline text-sm">
      <span className="flex-1 truncate" title={artifact.filename}>
        <strong className="text-ink-0">{artifact.filename}</strong>
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 font-mono">
        {formatBytes(artifact.size_bytes)}
      </span>
      <span className="text-[11px] text-ink-2 shrink-0 ml-1">
        {relativeTime(artifact.created_at)}
      </span>
    </li>
  );
}
