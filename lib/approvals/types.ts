import type { ApprovalDecision, ApprovalStatus } from "@/lib/api/types";

export interface ApprovalContext {
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
}

export interface ApprovalLite extends ApprovalContext {
  id: string;
  toolName: string;
  toolInput: unknown;
  expiresAt: string | undefined;
  status: ApprovalStatus;
  decidedAt?: number;
}

export interface ApprovalRecord extends ApprovalContext {
  id: string;
  runId: string;
  toolName: string;
  toolInput: unknown;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  expiresAt: string;
}

export type { ApprovalDecision, ApprovalStatus };
