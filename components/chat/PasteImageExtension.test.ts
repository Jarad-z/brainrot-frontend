import { describe, it, expect, vi } from "vitest";
import { createPasteImageExtension } from "./PasteImageExtension";

function makePasteEvent(items: Array<{ kind: string; type: string; file: File | null }>): ClipboardEvent {
  const ev = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(ev, "clipboardData", {
    value: {
      items: items.map((it) => ({
        kind: it.kind,
        type: it.type,
        getAsFile: () => it.file,
      })),
    } as unknown as DataTransfer,
  });
  return ev;
}

function pngFile(): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "clip.png", {
    type: "image/png",
  });
}

describe("createPasteImageExtension", () => {
  it("invokes onPasteImages with all image files and returns true", () => {
    const onPasteImages = vi.fn();
    const ext = createPasteImageExtension({ onPasteImages });
    // Tiptap Extension exposes its ProseMirror plugins via addProseMirrorPlugins.
    // We invoke handlePaste from the plugin spec directly.
    const plugins = ext.config.addProseMirrorPlugins!.call({} as never);
    const plugin = plugins[0]!;
    const handlePaste = plugin.props!.handlePaste as (
      view: unknown,
      event: ClipboardEvent,
    ) => boolean;

    const a = pngFile();
    const b = pngFile();
    const ev = makePasteEvent([
      { kind: "file", type: "image/png", file: a },
      { kind: "file", type: "image/png", file: b },
      { kind: "string", type: "text/plain", file: null },
    ]);

    const result = handlePaste(null, ev);
    expect(result).toBe(true);
    expect(onPasteImages).toHaveBeenCalledWith([a, b]);
  });

  it("returns false when clipboard has no image files", () => {
    const onPasteImages = vi.fn();
    const ext = createPasteImageExtension({ onPasteImages });
    const plugins = ext.config.addProseMirrorPlugins!.call({} as never);
    const plugin = plugins[0]!;
    const handlePaste = plugin.props!.handlePaste as (
      view: unknown,
      event: ClipboardEvent,
    ) => boolean;

    const ev = makePasteEvent([
      { kind: "string", type: "text/plain", file: null },
    ]);

    const result = handlePaste(null, ev);
    expect(result).toBe(false);
    expect(onPasteImages).not.toHaveBeenCalled();
  });
});
