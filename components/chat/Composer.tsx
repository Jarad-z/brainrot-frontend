"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";
import { useMemo, useRef, useState } from "react";
import type { Agent } from "@/lib/api/types";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { useSendMessage } from "@/hooks/useSendMessage";
import { Button } from "@/components/brand/button";
import { Loader2 } from "lucide-react";
import { MentionList, type MentionListHandle } from "./MentionList";
import { createMentionExtension } from "./MentionExtension";
import { createPasteImageExtension } from "./PasteImageExtension";
import { serializeEditor } from "@/lib/chat/serialize-editor";
import { useUploadAssets } from "@/hooks/useUploadAssets";
import { screenshotFilename } from "@/lib/upload/screenshot-filename";
import { messages } from "@/lib/messages";

interface ComposerProps {
  wsId: string;
  taskId: string;
  projectId: string;
}

export function Composer({ wsId, taskId, projectId }: ComposerProps) {
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const activeAgents = useMemo(() => agents.filter((a) => !a.archived), [agents]);
  const agentsRef = useRef<ReadonlyArray<Agent>>(activeAgents);
  agentsRef.current = activeAgents;

  const sendMutation = useSendMessage(taskId);
  const { start: startUpload } = useUploadAssets(projectId);
  const mentionListRef = useRef<MentionListHandle>(null);
  // Editor ref — onPasteImages closure runs after async upload; capturing
  // `editor` by name returns null because the closure was constructed during
  // the first render when useEditor hadn't returned yet. Use a ref synced
  // below to always read the live editor at paste time.
  const editorRef = useRef<Editor | null>(null);
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
      Placeholder.configure({
        placeholder: "输入消息，@ 一个 agent；Ctrl+Enter 发送",
        emptyEditorClass: "is-editor-empty",
      }),
      createMentionExtension({
        agentsRef,
        onRender: (props) => {
          setMentionState({
            open: true,
            items: props.items as Agent[],
            anchorRect: (props.clientRect?.() ?? null) as DOMRect | null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tiptap SuggestionProps.command is deeply parameterized
            onPick: (agent) => (props.command as any)(agent),
          });
        },
        onUpdate: (props) => {
          setMentionState((s) => ({
            ...s,
            items: props.items as Agent[],
            anchorRect: (props.clientRect?.() ?? s.anchorRect) as DOMRect | null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tiptap SuggestionProps.command is deeply parameterized
            onPick: (agent) => (props.command as any)(agent),
          }));
        },
        onExit: () => setMentionState((s) => ({ ...s, open: false })),
        onKeyDown: (event) => mentionListRef.current?.onKeyDown(event) ?? false,
      }),
      createPasteImageExtension({
        onPasteImages: (files: File[]) => {
          const now = new Date();
          const named: File[] = files.map((f) =>
            f.name && f.name !== "image.png"
              ? f
              : new File([f], screenshotFilename(now, f.type || "image/png"), {
                  type: f.type,
                }),
          );
          void (async () => {
            await startUpload(named);
            const ed = editorRef.current;
            if (!ed) return;
            for (const f of named) {
              ed.chain()
                .focus()
                .insertContent(messages.assets.pasteUploadedHint(f.name) + "\n")
                .run();
            }
          })();
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "composer-input outline-none min-h-[56px] py-2 px-1 text-base",
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
  editorRef.current = editor;

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
    <div className="composer-wrap composer-focus-ring border border-hairline rounded-xl bg-bg-primary p-3 flex flex-col gap-2 hover:border-ink-0/30 transition-colors">
      <EditorContent editor={editor} />
      <div className="flex items-center justify-end gap-3">
        <span className="text-[11px] text-ink-3 select-none">Ctrl+Enter</span>
        <Button size="sm" onClick={send} disabled={!editor || editor.isEmpty || sendMutation.isPending}>
          {sendMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              发送中
            </>
          ) : (
            "发送"
          )}
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
