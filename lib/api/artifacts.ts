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
