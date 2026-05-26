import { apiFetch } from "./client";
import type { Asset } from "./types";

/**
 * GET /api/v1/projects/{project_id}/assets
 *
 * Returns project assets ordered by created_at DESC (see docs/API.md §资产 ·
 * 列出项目素材).
 */
export async function fetchProjectAssets(projectId: string): Promise<Asset[]> {
  return apiFetch<Asset[]>(`/api/v1/projects/${projectId}/assets`);
}

/**
 * URL for downloading a single asset. Same-origin relative path so the
 * browser auto-attaches the session cookie (the Next dev rewrites /api/*
 * → :8080, and in production both ends share an origin). Used both as
 * an <a href> for the browser fallback path and as the URL handed to the
 * Electron main process for `shell.openPath`-style download-and-open.
 */
export function assetDownloadURL(projectId: string, assetId: string): string {
  return `/api/v1/projects/${projectId}/assets/${assetId}`;
}
