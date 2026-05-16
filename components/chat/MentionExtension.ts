import { Node, mergeAttributes } from "@tiptap/core";
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import type { Agent } from "@/lib/api/types";
import { filterCandidates } from "@/lib/chat/mention-filter";

interface BuildOptions {
  agentsRef: { current: ReadonlyArray<Agent> };
  onRender: (props: SuggestionProps<Agent>) => void;
  onUpdate: (props: SuggestionProps<Agent>) => void;
  onExit: () => void;
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const pluginKey = new PluginKey("brainrot-mention");

export function createMentionExtension(opts: BuildOptions) {
  return Node.create({
    name: "mention",
    inline: true,
    group: "inline",
    atom: true,
    selectable: true,

    addAttributes() {
      return {
        id: { default: null },
        handle: { default: null },
      };
    },

    parseHTML() {
      return [{ tag: "span[data-mention]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        "span",
        mergeAttributes(HTMLAttributes, {
          "data-mention": "",
          "data-id": node.attrs.id,
          class:
            "mention-pill inline-flex items-center px-1.5 py-0 mx-0.5 border-[1.5px] border-ink-0 bg-paper-1 rounded-sm text-xs font-bold",
        }),
        `@${node.attrs.handle}`,
      ];
    },

    addProseMirrorPlugins() {
      return [
        Suggestion<Agent>({
          editor: this.editor,
          char: "@",
          pluginKey,
          allowSpaces: false,
          startOfLine: false,
          items: ({ query }) =>
            filterCandidates(query, opts.agentsRef.current) as Agent[],
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: "mention",
                  attrs: { id: props.id, handle: props.handle },
                },
                { type: "text", text: " " },
              ])
              .run();
          },
          render: () => ({
            onStart: opts.onRender,
            onUpdate: opts.onUpdate,
            onKeyDown: ({ event }) => opts.onKeyDown(event),
            onExit: opts.onExit,
          }),
        } satisfies Partial<SuggestionOptions<Agent>>),
      ];
    },
  });
}
