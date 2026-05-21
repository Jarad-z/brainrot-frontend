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
        class:
          "composer-input outline-none min-h-[36px] py-1.5 text-[14px] leading-[1.6] text-ink-0",
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

  const isPending = sendMutation.isPending;
  const canSend = !!editor && !editor.isEmpty && !isPending;

  return (
    <div
      className="composer-wrap composer-focus-ring relative flex items-end gap-2 px-4 py-2 rounded-xl transition-all backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(248,250,253,0.78) 50%, rgba(240,244,249,0.76) 100%)",
        border: "1px solid rgba(255,255,255,0.75)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(50,80,110,0.06), 0 1px 2px rgba(20,62,107,0.08), 0 6px 16px rgba(20,62,107,0.10)",
      }}
    >
      <div className="flex-1 min-w-0">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-2 shrink-0 pb-0.5">
        <span className="text-[11px] text-ink-3 select-none hidden sm:inline">
          Ctrl+Enter
        </span>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-white transition-all active:translate-y-px ${
            canSend ? "aero-button hover:aero-button-hover" : ""
          }`}
          style={
            canSend
              ? undefined
              : {
                  background: "rgba(200,215,232,0.6)",
                  color: "rgba(94,122,150,0.7)",
                  border: "1px solid rgba(150,175,200,0.4)",
                }
          }
          aria-label="发送"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <SendGlyph />
          )}
        </button>
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

function SendGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 2.5V13.5M8 2.5L4 6.5M8 2.5L12 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
