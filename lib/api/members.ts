import { apiFetch } from "./client";
import type { WorkspaceMemberInput } from "./types";

export async function addWorkspaceMember(
  wsId: string,
  input: WorkspaceMemberInput,
): Promise<void> {
  await apiFetch<void>(`/api/v1/workspaces/${wsId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
