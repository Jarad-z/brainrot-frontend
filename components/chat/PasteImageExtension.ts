import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

interface Options {
  onPasteImages: (files: File[]) => void;
}

export function createPasteImageExtension(opts: Options) {
  return Extension.create({
    name: "pasteImage",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handlePaste(_view, event: ClipboardEvent) {
              const items = Array.from(event.clipboardData?.items ?? []);
              const images: File[] = [];
              for (const item of items) {
                if (item.kind === "file" && item.type.startsWith("image/")) {
                  const f = item.getAsFile();
                  if (f) images.push(f);
                }
              }
              if (images.length === 0) return false;
              opts.onPasteImages(images);
              return true;
            },
          },
        }),
      ];
    },
  });
}
