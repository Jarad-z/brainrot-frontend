import { apiFetch } from "./client";
import type { Artifact } from "./types";

/**
 * GET /api/v1/tasks/{task_id}/artifacts
 *
 * Returns the task's artifacts ordered by created_at DESC. Server filters
 * excluded=true rows (see docs/API.md §列出任务产出).
 */
export async function fetchTaskArtifacts(taskId: string): Promise<Artifact[]> {
  return apiFetch<Artifact[]>(`/api/v1/tasks/${taskId}/artifacts`);
}

/**
 * PATCH /api/v1/artifacts/{artifact_id} { excluded }
 *
 * Soft-excludes (or un-excludes) a single artifact. Server returns 204 on
 * success; 403 for viewer role; 404 for unknown id. See BACKEND_GAPS #28.
 */
export async function setArtifactExcluded(
  artifactId: string,
  excluded: boolean,
): Promise<void> {
  await apiFetch<void>(`/api/v1/artifacts/${artifactId}`, {
    method: "PATCH",
    body: JSON.stringify({ excluded }),
  });
}
