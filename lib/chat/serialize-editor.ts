import type { Editor } from "@tiptap/core";

export function serializeEditor(editor: Editor): { text: string; mentions: string[] } {
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
  // Collapse runs of 2+ spaces that immediately follow a mention handle.
  // The MentionExtension auto-inserts a single space after the picked mention;
  // when the user also types a space, two adjacent text nodes get concatenated
  // and we end up with "@handle  text". We fix it in serialization only —
  // the editor doc itself keeps the auto-space for UX reasons.
  const collapsed = text.replace(/(@[A-Za-z0-9_-]+)  +/g, "$1 ");
  return { text: collapsed.replace(/\n+$/, ""), mentions };
}
