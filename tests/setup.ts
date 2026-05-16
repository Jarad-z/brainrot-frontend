import "@testing-library/jest-dom/vitest";

// Tiptap calls Range.getBoundingClientRect; jsdom lacks it.
const rangeProto = Range.prototype as unknown as Record<string, unknown>;
if (!("getBoundingClientRect" in rangeProto)) {
  rangeProto.getBoundingClientRect = function () {
    return { x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect;
  };
}
if (!("getClientRects" in rangeProto)) {
  rangeProto.getClientRects = function () {
    return { length: 0, item: () => null, [Symbol.iterator]: function* () {} } as unknown as DOMRectList;
  };
}

// react-virtual / Tiptap consumers expect ResizeObserver.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
