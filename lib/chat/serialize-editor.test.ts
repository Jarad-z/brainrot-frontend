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

  describe("plain-text @handle fallback", () => {
    const agents = [
      { id: "a1", handle: "writer" },
      { id: "a2", handle: "coder" },
    ];

    it("resolves a typed @handle that never went through the suggestion popup", () => {
      const nodes = [paragraphNode(), textNode("@writer 你好")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, agents)).toEqual({ text: "@writer 你好", mentions: ["a1"] });
    });

    it("matches handles case-insensitively", () => {
      const nodes = [paragraphNode(), textNode("@Writer hi")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, agents)).toEqual({ text: "@Writer hi", mentions: ["a1"] });
    });

    it("ignores @handles that don't match any agent", () => {
      const nodes = [paragraphNode(), textNode("@unknown hi")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, agents)).toEqual({ text: "@unknown hi", mentions: [] });
    });

    it("de-duplicates an id already supplied by a real mention node", () => {
      const nodes = [paragraphNode(), mentionNode("a1", "writer"), textNode(" and again @writer")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, agents)).toEqual({ text: "@writer and again @writer", mentions: ["a1"] });
    });

    it("resolves multiple distinct @handles in order of appearance", () => {
      const nodes = [paragraphNode(), textNode("@coder then @writer")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, agents)).toEqual({ text: "@coder then @writer", mentions: ["a2", "a1"] });
    });

    it("does nothing when agents lookup is empty", () => {
      const nodes = [paragraphNode(), textNode("@writer hi")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, [])).toEqual({ text: "@writer hi", mentions: [] });
    });

    // Regression: a stray "@handle" in the middle of a word — e.g. CJK prose
    // like "agent就@writer" where the user is *referring* to the handle, not
    // mentioning it — must NOT dispatch an unintended run.
    // See docs/superpowers/reports/2026-05-28-mention-fallback-overmatch.md.
    it("does not resolve @handle attached to the end of another word", () => {
      const nodes = [paragraphNode(), mentionNode("a1", "writer"), textNode(" 测试 agent就@writer")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      // Only the real mention node contributes; the embedded "@writer" is prose.
      expect(serializeEditor(ed, agents)).toEqual({
        text: "@writer 测试 agent就@writer",
        mentions: ["a1"],
      });
    });

    it("does not resolve @handle when preceded by a non-space ASCII char", () => {
      const nodes = [paragraphNode(), textNode("foo@writer bar")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, agents)).toEqual({ text: "foo@writer bar", mentions: [] });
    });

    it("still resolves @handle after a newline", () => {
      const nodes = [paragraphNode(), textNode("line 1"), paragraphNode(), textNode("@writer hi")];
      const ed = mockEditor({ descendants: (cb) => { for (const n of nodes) cb(n); } });
      expect(serializeEditor(ed, agents)).toEqual({ text: "line 1\n@writer hi", mentions: ["a1"] });
    });
  });
});
