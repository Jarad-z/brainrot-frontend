import type { ClientMessage, ApprovalRequest } from "@/lib/api/types";
import type { DecisionRecord } from "@/lib/store/chat-ui";
import type { ApprovalLite, ApprovalRecord, ApprovalContext } from "./types";

function decodeBase64Json(s: string): unknown {
  if (!s) return null;
  try {
    if (typeof atob === "function") {
      return JSON.parse(atob(s));
    }
    return JSON.parse(Buffer.from(s, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function deriveApprovalsFromMessages(
  messages: ClientMessage[],
  decisions: Map<string, DecisionRecord>,
  ctx: ApprovalContext,
): ApprovalLite[] {
  const out: ApprovalLite[] = [];
  for (const m of messages) {
    if (m.parsed.type !== "permission_request") continue;
    const p = m.parsed.payload;
    const id = p.approval_id ?? p.tool_use_id ?? m.id;
    const decided = decisions.get(id);
    out.push({
      id,
      taskId: ctx.taskId,
      taskTitle: ctx.taskTitle,
      projectId: ctx.projectId,
      projectName: ctx.projectName,
      toolName: p.tool_name,
      toolInput: p.tool_input,
      expiresAt: p.expires_at,
      status: decided ? decided.decision : "pending",
      decidedAt: decided?.at,
    });
  }
  // Hub view only shows pending (Q7).
  return out.filter((a) => a.status === "pending");
}

export function normalizeApprovalRequest(
  req: ApprovalRequest,
  ctx: ApprovalContext,
): ApprovalRecord {
  return {
    id: req.id,
    runId: req.run_id,
    toolName: req.tool_name,
    toolInput: decodeBase64Json(req.tool_input),
    status: req.status,
    decidedBy: req.decided_by,
    decidedAt: req.decided_at,
    decisionNote: req.decision_note,
    createdAt: req.created_at,
    expiresAt: req.expires_at,
    projectId: ctx.projectId,
    projectName: ctx.projectName,
    taskId: ctx.taskId,
    taskTitle: ctx.taskTitle,
  };
}
