"use client";

import { useState, type KeyboardEvent } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { sendDirectMessage } from "@/lib/api/conversations";
import { queryKeys } from "@/lib/api/keys";

interface ChatComposerProps {
  peerId: string;
}

export function ChatComposer({ peerId }: ChatComposerProps) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const mu = useMutation({
    mutationFn: (text: string) => sendDirectMessage(peerId, text),
    onSuccess: () => {
      // Cache + list updates happen via WS dm.sent handler (Task 28),
      // but invalidate the list explicitly to cover the slow-WS / first-DM case
      // where the conversation was lazy-created server-side.
      qc.invalidateQueries({ queryKey: queryKeys.conversations.list() });
    },
  });

  function submit() {
    const text = body.trim();
    if (!text || mu.isPending) return;
    setBody("");
    mu.mutate(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-line p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a message. Enter to send, Shift+Enter for newline."
        rows={2}
        className="w-full resize-none rounded border border-line px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ink-0"
        disabled={mu.isPending}
      />
      {mu.isError && (
        <div className="mt-1 text-xs text-state-failed">
          Failed to send. {mu.error instanceof Error ? mu.error.message : ""}
        </div>
      )}
    </div>
  );
}
