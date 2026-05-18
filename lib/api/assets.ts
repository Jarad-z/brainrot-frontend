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
