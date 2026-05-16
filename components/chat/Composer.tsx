"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { useMemo, useRef, useState } from "react";
import type { Agent } from "@/lib/api/types";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { useSendMessage } from "@/hooks/useSendMessage";
import { Button } from "@/components/brand/button";
import { MentionList, type MentionListHandle } from "./MentionList";
import { createMentionExtension } from "./MentionExtension";
import { serializeEditor } from "@/lib/chat/serialize-editor";

interface ComposerProps {
  wsId: string;
  taskId: string;
}

export function Composer({ wsId, taskId }: ComposerProps) {
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const activeAgents = useMemo(() => agents.filter((a) => !a.archived), [agents]);
  const agentsRef = useRef<ReadonlyArray<Agent>>(activeAgents);
  agentsRef.current = activeAgents;

  const sendMutation = useSendMessage(taskId);
  const mentionListRef = useRef<MentionListHandle>(null);
  const [mentionState, setMentionState] = useState<{
    open: boolean;
    items: Agent[];
    anchorRect: DOMRect | null;
    onPick: (a: Agent) => void;
  }>({ open: false, items: [], anchorRect: null, onPick: () => {} });

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      createMentionExtension({
        agentsRef,
        onRender: (props) => {
          setMentionState({
            open: true,
            items: props.items as Agent[],
            anchorRect: (props.clientRect?.() ?? null) as DOMRect | null,
            onPick: (agent) => (props.command as any)(agent),
          });
        },
        onUpdate: (props) => {
          setMentionState((s) => ({
            ...s,
            items: props.items as Agent[],
            anchorRect: (props.clientRect?.() ?? s.anchorRect) as DOMRect | null,
            onPick: (agent) => (props.command as any)(agent),
          }));
        },
        onExit: () => setMentionState((s) => ({ ...s, open: false })),
        onKeyDown: (event) => mentionListRef.current?.onKeyDown(event) ?? false,
      }),
    ],
    editorProps: {
      attributes: {
        class: "composer-input outline-none min-h-[60px] py-2 px-1 text-base",
      },
      handleKeyDown(_view, event) {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          send();
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  function send() {
    if (!editor) return;
    const { text, mentions } = serializeEditor(editor);
    if (!text.trim()) return;
    sendMutation.mutate(
      { text, mentions },
      {
        onSuccess: () => {
          editor.commands.clearContent();
          editor.commands.focus("end");
        },
        onError: () => {
          editor.commands.focus("end");
        },
      }
    );
  }

  return (
    <div className="composer-wrap border-[1.5px] border-ink-0 rounded-md bg-paper-0 p-3 shadow-[var(--shadow-current)] flex flex-col gap-2">
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between text-xs text-ink-2">
        <span>Ctrl+Enter 发送</span>
        <Button onClick={send} disabled={!editor || editor.isEmpty || sendMutation.isPending}>
          {sendMutation.isPending ? "发送中…" : "发送"}
        </Button>
      </div>
      {mentionState.open && mentionState.anchorRect && (
        <MentionList
          ref={mentionListRef}
          candidates={mentionState.items}
          anchorRect={mentionState.anchorRect}
          onPick={mentionState.onPick}
          onClose={() => setMentionState((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
}
