"use client";
import { useState } from "react";
import { useCancelRun } from "@/hooks/useCancelRun";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";

interface CancelRunButtonProps {
  taskId: string;
  busy: boolean;
}

const COOLDOWN_MS = 5_000;

export function CancelRunButton({ taskId, busy }: CancelRunButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const cancel = useCancelRun(taskId);

  if (!busy) return null;

  const cooling = Date.now() < lockedUntil;
  const disabled = cooling || cancel.isPending;

  function openDialog() {
    if (disabled) return;
    setDialogOpen(true);
  }

  function confirm() {
    cancel.mutate();
    setLockedUntil(Date.now() + COOLDOWN_MS);
    // Trigger re-render when cooldown ends.
    setTimeout(() => setLockedUntil(0), COOLDOWN_MS + 50);
  }

  return (
    <>
      <button
        onClick={openDialog}
        disabled={disabled}
        className="px-3 py-1.5 border-[1.5px] border-ink-0 rounded-sm text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        取消运行
      </button>
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="取消当前运行？"
        description="后端将立即终止当前正在跑的 run。"
        knownIssueNote="已知后端问题 #18：取消之后，本任务排队中的后续消息会卡住，需重新发送一次才能继续。"
        confirmLabel="确认取消"
        cancelLabel="返回"
        onConfirm={confirm}
        destructive
      />
    </>
  );
}
