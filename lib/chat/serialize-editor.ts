import type { Editor } from "@tiptap/core";

export interface SerializeAgentLookup {
  id: string;
  handle: string;
}

export function serializeEditor(
  editor: Editor,
  agents?: ReadonlyArray<SerializeAgentLookup>,
): { text: string; mentions: string[] } {
  const mentions: string[] = [];
  let text = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ProseMirror Node type is deeply parameterized; we access well-known fields
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === "mention") {
      text += `@${node.attrs.handle}`;
      mentions.push(node.attrs.id);
    } else if (node.isText) {
      text += node.text ?? "";
    } else if (node.type.name === "paragraph") {
      if (text.length > 0 && !text.endsWith("\n")) text += "\n";
    }
    return true;
  });
  const collapsed = text.replace(/(@[A-Za-z0-9_-]+)  +/g, "$1 ");
  const trimmed = collapsed.replace(/\n+$/, "");

  // Fallback: a user who types "@writer" without committing the suggestion
  // popup produces a plain text token, no mention node. Resolve any
  // @handle substrings against the supplied agent lookup so the backend
  // still gets a real agent id and dispatches a run.
  //
  // Only treat @handle as a mention when it sits at the start of the text or
  // after whitespace — same trigger rule as activePrefix() in mention-parse.ts.
  // Without this guard, a literal "@handle" embedded mid-word (e.g. the user
  // writing "agent就@writer" as instructional prose to another agent) gets
  // mis-parsed as a real mention and dispatches an unintended run. See
  // docs/superpowers/reports/2026-05-28-mention-fallback-overmatch.md.
  if (agents && agents.length > 0) {
    const seen = new Set(mentions);
    const byHandle = new Map<string, string>();
    for (const a of agents) byHandle.set(a.handle.toLowerCase(), a.id);
    const re = /(?:^|\s)@([A-Za-z0-9_-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(trimmed)) !== null) {
      const handle = m[1];
      if (!handle) continue;
      const id = byHandle.get(handle.toLowerCase());
      if (id && !seen.has(id)) {
        seen.add(id);
        mentions.push(id);
      }
    }
  }

  return { text: trimmed, mentions };
}
