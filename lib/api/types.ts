// User uses PascalCase to match the /me endpoint response (see BACKEND_GAPS.md #3).
export interface User {
  ID: string;
  Email: string;
  Name: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "open" | "in_progress" | "done" | "blocked" | "archived";

export interface TaskCard {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  done_at: string | null;
}
