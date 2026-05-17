/* eslint-disable @typescript-eslint/no-explicit-any -- test mocks for Tiptap Editor shape */
import { describe, it, expect } from "vitest";
import { serializeEditor } from "./serialize-editor";

// Build a minimal Editor-shaped mock that satisfies serializeEditor's reads.
function mockEditor(doc: { descendants: (cb: (node: any) => boolean) => void }) {
  return { state: { doc } } as any;
}

function textNode(text: string) {
  return { type: { name: "text" }, isText: true, text };
}
function mentionNode(id: string, handle: string) {
  return { type: { name: "mention" }, isText: false, attrs: { id, handle } };
}
function paragraphNode() {
  return { type: { name: "paragraph" }, isText: false };
}

describe("serializeEditor", () => {
  it("serializes a single mention with trailing text", () => {
    const nodes = [paragraphNode(), mentionNode("a1", "writer"), textNode(" hello")];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "@writer hello", mentions: ["a1"] });
  });

  it("serializes multiple mentions", () => {
    const nodes = [paragraphNode(), mentionNode("a1", "writer"), textNode(" and "), mentionNode("a2", "coder")];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "@writer and @coder", mentions: ["a1", "a2"] });
  });

  it("inserts \\n between paragraphs", () => {
    const nodes = [paragraphNode(), textNode("line 1"), paragraphNode(), textNode("line 2")];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "line 1\nline 2", mentions: [] });
  });

  it("plain text with no mention returns empty mentions array", () => {
    const nodes = [paragraphNode(), textNode("hello world")];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "hello world", mentions: [] });
  });
});
