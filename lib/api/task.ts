import { apiFetch, ApiError } from "./client";
import type { TaskCard } from "./types";

// API.md does not document a single-task GET; this calls the implied route
// and falls through to a sentinel undefined response so callers can fall
// back to the project task-list cache.
export async function fetchTask(taskId: string): Promise<TaskCard | undefined> {
  try {
    return await apiFetch<TaskCard>(`/api/v1/tasks/${taskId}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
      return undefined;
    }
    throw e;
  }
}
