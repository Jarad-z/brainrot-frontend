export const queryKeys = {
  me: {
    self: () => ["me"] as const,
    pendingApprovals: () => ["me", "pending-approvals"] as const,
    pendingApprovalsCount: () => ["me", "pending-approvals", "count"] as const,
  },
  workspaces: {
    list: () => ["workspaces"] as const,
    detail: (wsId: string) => ["workspaces", wsId] as const,
    projects: (wsId: string) => ["workspaces", wsId, "projects"] as const,
    agents: (wsId: string) => ["workspaces", wsId, "agents"] as const,
    runtimes: (wsId: string) => ["workspaces", wsId, "runtimes"] as const,
    approvals: (wsId: string) => ["workspaces", wsId, "approvals"] as const,
    members: (wsId: string) => ["workspaces", wsId, "members"] as const,
  },
  agents: {
    detail: (agentId: string) => ["agents", agentId] as const,
  },
  projects: {
    detail: (projectId: string) => ["projects", projectId] as const,
    tasks: (projectId: string) => ["projects", projectId, "tasks"] as const,
    assets: (projectId: string) => ["projects", projectId, "assets"] as const,
  },
  tasks: {
    detail: (taskId: string) => ["tasks", taskId] as const,
    messages: (taskId: string) => ["tasks", taskId, "messages"] as const,
    artifacts: (taskId: string) => ["tasks", taskId, "artifacts"] as const,
    runs: (taskId: string) => ["tasks", taskId, "runs"] as const,
  },
  approvals: {
    task: (taskId: string) => ["approvals", "task", taskId] as const,
  },
  friends: {
    list: () => ["friends"] as const,
    requests: () => ["friends", "requests"] as const,
    blocked: () => ["friends", "blocked"] as const,
    search: (email: string) => ["friends", "search", email] as const,
  },
  invitations: {
    incoming: () => ["invitations", "incoming"] as const,
    workspace: (wsId: string) => ["invitations", "workspace", wsId] as const,
  },
  conversations: {
    list: () => ["conversations"] as const,
    messages: (convId: string) => ["conversations", convId, "messages"] as const,
  },
  marketplace: {
    search: (q: string) => ["marketplace", "search", q] as const,
    list: () => ["marketplace", "list"] as const,
    agent: (agentId: string) => ["marketplace", "agent", agentId] as const,
  },
  installs: {
    workspace: (wsId: string) => ["installs", "workspace", wsId] as const,
  },
  plugins: {
    // Plugins owned by a workspace (author side).
    ownedBy: (wsId: string) => ["plugins", "owned-by", wsId] as const,
    // A single plugin by id (detail page, marketplace detail).
    detail: (pluginId: string) => ["plugins", pluginId] as const,
    // Version list for a plugin.
    versions: (pluginId: string) => ["plugins", pluginId, "versions"] as const,
    // Marketplace search (consumer side).
    marketplace: (q: string) => ["plugins", "marketplace", q] as const,
    // Plugin installs in a workspace (consumer side).
    workspaceInstalls: (wsId: string) => ["plugins", "ws-installs", wsId] as const,
    // Plugins attached to an agent (agent detail page).
    agentAttachments: (agentId: string) => ["plugins", "agent", agentId] as const,
  },
} as const;
