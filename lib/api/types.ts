import type { ParsedMessage } from "@/lib/parse-message";

// BACKEND_GAPS #3 resolved (2026-05-17): backend now returns snake_case
// {id, email, name} from /me.
export interface User {
  id: string;
  email: string;
  name: string;
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
  // BACKEND_GAPS #6 (resolved 2026-05-17): true when an active run exists for this task
  busy?: boolean;
  // BACKEND_GAPS #13 (resolved 2026-05-17): agent uuids associated with this task
  agents?: string[];
}

export type AgentBackendType = "claude";

export interface Agent {
  id: string;
  workspace_id: string;
  runtime_id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  description: string;
  instructions: string;
  backend_type: AgentBackendType;
  model: string | null;
  custom_env: string;
  custom_args: string;
  mcp_config: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  task_card_id: string;
  role: "user" | "agent" | "system";
  author_user_id: string | null;
  author_agent_id: string | null;
  content: string;
  task_run_id: string | null;
  seq: number | null;
  metadata: string;
  created_at: string;
}

export interface ClientMessage extends Message {
  parsed: ParsedMessage;
  meta: { queued?: boolean };
  tempId?: string;
}

export type ApprovalDecision = "approved" | "denied" | "approved_with_edits";
export type ApprovalStatus = ApprovalDecision | "pending" | "timeout";

export interface ApprovalRequest {
  id: string;
  run_id: string;
  task_card_id: string;
  tool_name: string;
  tool_input: string;
  status: ApprovalStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  expires_at: string;
}

// Shared base shape — both Asset and Artifact have these fields.
interface BlobBase {
  id: string;
  project_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  blob_key: string;
  sha256: string;
  created_at: string;
}

// Project-scoped, uploaded by a human user.
export interface Asset extends BlobBase {
  uploaded_by: string;
}

// Task-scoped, produced by an agent run; excluded=true rows are filtered
// server-side (see API.md §列出任务产出).
export interface Artifact extends BlobBase {
  task_card_id: string;
  task_run_id: string | null;
  source: string;
  excluded: boolean;
}

export interface EnqueuedRun {
  RunID: string;
  AgentID: string;
  RuntimeID: string;
}
