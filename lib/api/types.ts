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

/** Agent as returned by the backend (jsonb columns are decoded server-side). */
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
  custom_env: Record<string, string>;
  custom_args: string[];
  mcp_config: Record<string, unknown>;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

/** Input shape for POST /agents and PATCH /agents/{id}. Already in decoded form. */
export interface AgentInput {
  runtime_id: string;
  handle: string;
  name: string;
  avatar_url?: string;
  description?: string;
  instructions?: string;
  model?: string;
  custom_env: Record<string, string>;
  custom_args: string[];
  mcp_config: Record<string, unknown>;
}

export interface Message {
  id: string;
  task_card_id: string;
  role: "user" | "agent" | "system";
  author_user_id: string | null;
  author_agent_id: string | null;
  content: Record<string, unknown>;
  task_run_id: string | null;
  seq: number | null;
  metadata: Record<string, unknown>;
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

export type RunStatus =
  | "pending"
  | "claimed"
  | "running"
  | "awaiting_approval"
  | "done"
  | "canceled"
  | "failed";

// GET /tasks/{id}/runs — BACKEND_GAPS #26 (closed). agent_snapshot/metadata are
// intentionally stripped server-side (would leak custom_env / API keys).
export interface RunView {
  id: string;
  workspace_id: string;
  task_card_id: string;
  agent_id: string;
  runtime_id: string;
  trigger_message_id: string | null;
  session_id: string | null;
  status: RunStatus;
  error: string | null;
  created_at: string;
  claimed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface Runtime {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  host: string | null;
  os: string | null;
  arch: string | null;
  online: boolean;
  last_heartbeat: string | null;
  capacity: number;
  revoked: boolean;
  created_at: string;
}

export interface InstallToken {
  token: string;
  expires_at: string;
}

/** From GET /me/pending-approvals — ApprovalRequest plus enough ws/project/agent context for the top-level hub.
 *  Note: backend does NOT include workspace_name; UI must look it up via useWorkspaces() or display the project_name. */
export interface PendingApproval extends ApprovalRequest {
  workspace_id: string;
  project_id: string;
  project_name: string;
  task_id: string;
  task_title: string;
  agent_id: string;
  agent_handle: string;
}

export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface WorkspaceMemberInput {
  user_id: string;
  role: WorkspaceRole;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface CreateTaskInput {
  title: string;
  summary?: string;
  sort_order?: number;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
}

export type RelationshipStatus =
  | "none" | "pending_outgoing" | "pending_incoming"
  | "accepted" | "blocked_by_me" | "blocked_by_them";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  relationship_status: RelationshipStatus;
}

export interface ConvSummary {
  id: string;
  peer: UserSummary;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
}

export interface InvitationView {
  id: string;
  workspace_id: string;
  workspace_name?: string;
  workspace_slug?: string;
  inviter_id: string;
  inviter_name?: string;
  invitee_id: string;
  invitee_name?: string;
  invitee_email?: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
}

// Marketplace
export interface PublicAgentView {
  id: string;
  handle: string;
  name: string;
  avatar_url?: string;
  description: string;
  published_at?: string;
  install_count: number;
  publisher_id: string;
  publisher_name: string;
  publisher_avatar_url?: string;
}

export interface InstallView {
  id: string;
  workspace_id: string;
  source_agent_id: string;
  source_handle: string;
  source_name: string;
  source_avatar_url?: string;
  source_description: string;
  effective_handle: string;
  alias_handle?: string;
  publisher_id: string;
  publisher_name: string;
  installed_at: string;
}

// AgentRefView — extends the existing Agent type with marketplace-aware fields.
// The backend's AgentRefView embeds the full AgentView shape and adds these.
//
// runtime_online is hydrated by the server from the agent's runtime row at
// list time. For installed (marketplace) agents the publisher's runtime lives
// in another workspace and is therefore NOT in this consumer's
// GET /workspaces/{wsId}/runtimes — read presence from this field instead of
// crossing the runtimes map (which would always say "offline").
export interface AgentRefView extends Agent {
  effective_handle: string;
  is_installed: boolean;
  install_id?: string;
  publisher_workspace_id: string;
  visibility: "private" | "public";
  runtime_online: boolean;
}
