"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCancelRun } from "@/hooks/useCancelRun";
import { useActiveRuns } from "@/hooks/useActiveRuns";

const COOLDOWN_MS = 5_000;
const TOAST_MS = 2_500;

/**
 * Ctrl+C (or Cmd+C) interrupts the active run on this task card.
 *
 * Only fires when:
 *  - this card actually has an active run (shares useActiveRuns with the list
 *    "正在运行" badge and the in-chat "在思考" bar, so the shortcut is live
 *    exactly when those are showing), and
 *  - the user is NOT trying to copy: we bail if there's a non-empty text
 *    selection or focus is inside an input / textarea / contenteditable (the
 *    Tiptap composer). In those cases the browser's native copy is left alone.
 *
 * Returns { running, toast }: `running` lets the caller show the hint only
 * while the shortcut is live; `toast` is a transient feedback string
 * (interrupting via a keyboard shortcut is otherwise invisible — the run/badge
 * only clears on the next /runs poll, up to 5s later).
 */
export interface CancelRunHotkeyState {
  running: boolean;
  toast: string | null;
}

export function useCancelRunHotkey(taskId: string): CancelRunHotkeyState {
  const activeRuns = useActiveRuns(taskId);
  const running = activeRuns.length > 0;
  const cancel = useCancelRun(taskId);

  const [toast, setToast] = useState<string | null>(null);
  const lockedUntilRef = useRef(0);
  // Keep the latest `running` reachable inside the keydown listener without
  // re-binding the listener on every poll.
  const runningRef = useRef(running);
  runningRef.current = running;

  const trigger = useCallback(() => {
    const now = Date.now();
    if (now < lockedUntilRef.current || cancel.isPending) return;
    lockedUntilRef.current = now + COOLDOWN_MS;
    cancel.mutate(undefined, {
      onError: () => {
        // 400 == already canceled by someone else (SQL hit 0 rows). Treat as
        // "nothing to interrupt" rather than surfacing a scary error.
        setToast("没有正在运行的任务可中断");
      },
    });
    setToast("已发送中断…");
  }, [cancel]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "c" && e.key !== "C") return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.altKey || e.shiftKey) return;
      if (!runningRef.current) return;

      // Don't steal copy: leave native Ctrl/Cmd+C alone when text is selected.
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) return;

      // Don't steal copy from editable targets (composer / mention editor).
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) return;
      }

      e.preventDefault();
      trigger();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [trigger]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  return { running, toast };
}
