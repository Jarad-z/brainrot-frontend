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

  it("collapses double space after a mention", () => {
    const nodes = [
      paragraphNode(),
      mentionNode("a1", "coder"),
      textNode(" "), // auto-inserted by MentionExtension
      textNode(" 你好"), // user typed
    ];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "@coder 你好", mentions: ["a1"] });
  });

  it("leaves a single space alone", () => {
    const nodes = [paragraphNode(), mentionNode("a1", "coder"), textNode(" 你好")];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "@coder 你好", mentions: ["a1"] });
  });

  it("handles no space (mention followed immediately by text)", () => {
    const nodes = [paragraphNode(), mentionNode("a1", "coder"), textNode("你好")];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "@coder你好", mentions: ["a1"] });
  });

  it("collapses double space after each of two consecutive mentions", () => {
    const nodes = [
      paragraphNode(),
      mentionNode("a1", "a"),
      textNode(" "),
      textNode(" "), // user typed extra space
      mentionNode("a2", "b"),
      textNode(" "),
      textNode(" 你好"),
    ];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "@a @b 你好", mentions: ["a1", "a2"] });
  });

  it("does not collapse double spaces elsewhere in the text", () => {
    const nodes = [paragraphNode(), textNode("hello  world")];
    const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
    expect(serializeEditor(ed)).toEqual({ text: "hello  world", mentions: [] });
  });
});
