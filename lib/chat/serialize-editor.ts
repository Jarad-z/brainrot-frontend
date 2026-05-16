import type { Editor } from "@tiptap/core";

export function serializeEditor(editor: Editor): { text: string; mentions: string[] } {
  const mentions: string[] = [];
  let text = "";
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
  return { text: text.replace(/\n+$/, ""), mentions };
}
