export const queryKeys = {
  me: () => ["me"] as const,
  workspaces: {
    detail: (wsId: string) => ["workspaces", wsId] as const,
    projects: (wsId: string) => ["workspaces", wsId, "projects"] as const,
    agents: (wsId: string) => ["workspaces", wsId, "agents"] as const,
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
  },
  approvals: {
    task: (taskId: string) => ["approvals", "task", taskId] as const,
  },
} as const;
