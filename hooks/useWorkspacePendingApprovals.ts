"use client";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { queryKeys } from "@/lib/api/keys";
import { useChatUIStore, getDecision } from "@/lib/store/chat-ui";
import type { ClientMessage, Project, TaskCard } from "@/lib/api/types";
import type { DecisionRecord } from "@/lib/store/chat-ui";
import { deriveApprovalsFromMessages } from "@/lib/approvals/derive";
import type { ApprovalLite } from "@/lib/approvals/types";

export function useWorkspacePendingApprovals(wsId: string): ApprovalLite[] {
  const qc = useQueryClient();
  const { data: projects = [] } = useProjects(wsId);

  // Subscribe to the chat-ui store so the hook re-renders when a decision is recorded.
  const decisionsSlot = useChatUIStore((s) => s.byTask);
  void decisionsSlot;

  return useMemo(() => {
    const state = useChatUIStore.getState();
    const collected: ApprovalLite[] = [];
    for (const project of projects as Project[]) {
      const tasks =
        qc.getQueryData<TaskCard[]>(queryKeys.projects.tasks(project.id)) ?? [];
      for (const task of tasks) {
        const messages =
          qc.getQueryData<ClientMessage[]>(queryKeys.tasks.messages(task.id)) ?? [];
        if (messages.length === 0) continue;
        // Build a per-task decisions map limited to ids we see in this task's messages.
        const decisions = new Map<string, DecisionRecord>();
        for (const m of messages) {
          if (m.parsed.type !== "permission_request") continue;
          const p = m.parsed.payload;
          const id = p.approval_id ?? p.tool_use_id ?? m.id;
          const d = getDecision(state, id);
          if (d) decisions.set(id, d);
        }
        collected.push(
          ...deriveApprovalsFromMessages(messages, decisions, {
            projectId: project.id,
            projectName: project.name,
            taskId: task.id,
            taskTitle: task.title,
          }),
        );
      }
    }
    // Sort ascending by expiresAt (undefined → end of list).
    collected.sort((a, b) => {
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return a.expiresAt.localeCompare(b.expiresAt);
    });
    return collected;
  }, [qc, projects, decisionsSlot]);
}
