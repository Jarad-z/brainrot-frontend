import { describe, it, expect } from "vitest";
import {
  deriveApprovalsFromMessages,
  normalizeApprovalRequest,
} from "./derive";
import type { ClientMessage, ApprovalRequest } from "@/lib/api/types";
import type { DecisionRecord } from "@/lib/store/chat-ui";

function permMsg(opts: {
  id?: string;
  approvalId?: string;
  toolUseId?: string;
  toolName?: string;
  expiresAt?: string;
  toolInput?: unknown;
  createdAt?: string;
}): ClientMessage {
  return {
    id: opts.id ?? "m1",
    task_card_id: "t1",
    role: "agent",
    author_user_id: null,
    author_agent_id: "a1",
    content: {},
    task_run_id: "r1",
    seq: 1,
    metadata: {},
    created_at: opts.createdAt ?? "2026-05-17T10:00:00Z",
    meta: {},
    parsed: {
      type: "permission_request",
      payload: {
        approval_id: opts.approvalId,
        tool_use_id: opts.toolUseId,
        tool_name: opts.toolName ?? "Bash",
        tool_input: opts.toolInput ?? { command: "ls" },
        expires_at: opts.expiresAt,
      },
    } as ClientMessage["parsed"],
  };
}

function userMsg(id = "u1"): ClientMessage {
  return {
    id,
    task_card_id: "t1",
    role: "user",
    author_user_id: "u",
    author_agent_id: null,
    content: {},
    task_run_id: null,
    seq: null,
    metadata: {},
    created_at: "2026-05-17T09:00:00Z",
    meta: {},
    parsed: { type: "user", text: "hi", mentions: [] },
  };
}

const CTX = {
  projectId: "p1",
  projectName: "Launch Plan",
  taskId: "t1",
  taskTitle: "Write press release",
} as const;

describe("deriveApprovalsFromMessages", () => {
  it("returns empty for empty input", () => {
    expect(deriveApprovalsFromMessages([], new Map(), CTX)).toEqual([]);
  });

  it("returns one pending ApprovalLite for one permission_request", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: "ap1", expiresAt: "2026-05-17T11:00:00Z" })],
      new Map(),
      CTX,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "ap1",
      taskId: "t1",
      taskTitle: "Write press release",
      projectId: "p1",
      projectName: "Launch Plan",
      toolName: "Bash",
      status: "pending",
      expiresAt: "2026-05-17T11:00:00Z",
    });
  });

  it("excludes approvals already decided (via decisions map)", () => {
    const decisions = new Map<string, DecisionRecord>([
      ["ap1", { decision: "approved", at: Date.now() }],
    ]);
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: "ap1" })],
      decisions,
      CTX,
    );
    expect(out).toEqual([]);
  });

  it("falls back to tool_use_id when approval_id is absent", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: undefined, toolUseId: "tu1" })],
      new Map(),
      CTX,
    );
    expect(out[0]?.id).toBe("tu1");
  });

  it("falls back to message.id when both approval_id and tool_use_id absent", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ id: "msgX", approvalId: undefined, toolUseId: undefined })],
      new Map(),
      CTX,
    );
    expect(out[0]?.id).toBe("msgX");
  });

  it("ignores non-permission_request messages", () => {
    const out = deriveApprovalsFromMessages(
      [userMsg("u1"), permMsg({ approvalId: "ap1" }), userMsg("u2")],
      new Map(),
      CTX,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("ap1");
  });

  it("preserves expiresAt as undefined when payload omits it", () => {
    const out = deriveApprovalsFromMessages(
      [permMsg({ approvalId: "ap1", expiresAt: undefined })],
      new Map(),
      CTX,
    );
    expect(out[0]?.expiresAt).toBeUndefined();
  });
});

describe("normalizeApprovalRequest", () => {
  it("maps ApprovalRequest to ApprovalRecord", () => {
    const req: ApprovalRequest = {
      id: "ap1",
      run_id: "r1",
      task_card_id: "t1",
      tool_name: "Bash",
      tool_input: "eyJjb21tYW5kIjoibHMifQ==",
      status: "approved",
      decided_by: "u1",
      decided_at: "2026-05-17T10:30:00Z",
      decision_note: "ok",
      created_at: "2026-05-17T10:00:00Z",
      expires_at: "2026-05-17T11:00:00Z",
    };
    const out = normalizeApprovalRequest(req, {
      projectId: "p1",
      projectName: "Launch Plan",
      taskId: "t1",
      taskTitle: "Write press release",
    });
    expect(out).toMatchObject({
      id: "ap1",
      status: "approved",
      decidedBy: "u1",
      decidedAt: "2026-05-17T10:30:00Z",
      decisionNote: "ok",
      toolName: "Bash",
      expiresAt: "2026-05-17T11:00:00Z",
    });
    // tool_input is base64-decoded JSON
    expect(out.toolInput).toEqual({ command: "ls" });
  });
});
