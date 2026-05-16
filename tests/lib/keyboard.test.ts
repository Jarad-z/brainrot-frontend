import { describe, it, expect } from "vitest";
import { isKey, focusNext } from "@/lib/keyboard";

function fakeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: "",
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  } as KeyboardEvent;
}

describe("isKey", () => {
  it("matches key without modifiers", () => {
    expect(isKey(fakeEvent({ key: "Enter" }), "Enter")).toBe(true);
  });
  it("rejects different key", () => {
    expect(isKey(fakeEvent({ key: "Escape" }), "Enter")).toBe(false);
  });
  it("matches with required modifier", () => {
    expect(isKey(fakeEvent({ key: "Enter", ctrlKey: true }), "Enter", { ctrl: true })).toBe(true);
  });
  it("rejects when modifier missing", () => {
    expect(isKey(fakeEvent({ key: "Enter" }), "Enter", { ctrl: true })).toBe(false);
  });
  it("rejects when modifier present but required to be absent", () => {
    expect(isKey(fakeEvent({ key: "Enter", shiftKey: true }), "Enter", { shift: false })).toBe(
      false,
    );
  });
  it("matches meta modifier", () => {
    expect(isKey(fakeEvent({ key: "k", metaKey: true }), "k", { meta: true })).toBe(true);
  });
  it("matches alt modifier", () => {
    expect(isKey(fakeEvent({ key: "Tab", altKey: true }), "Tab", { alt: true })).toBe(true);
  });
  it("rejects when meta present but not required", () => {
    expect(isKey(fakeEvent({ key: "Enter", metaKey: true }), "Enter", { meta: false })).toBe(false);
  });
});

describe("focusNext", () => {
  it("returns null when no focusables", () => {
    const div = document.createElement("div");
    expect(focusNext(div, null, 1)).toBeNull();
  });
  it("focuses first focusable from null current", () => {
    const div = document.createElement("div");
    const btn1 = document.createElement("button");
    const btn2 = document.createElement("button");
    div.append(btn1, btn2);
    document.body.appendChild(div);
    expect(focusNext(div, null, 1)).toBe(btn1);
    document.body.removeChild(div);
  });
  it("wraps around forward", () => {
    const div = document.createElement("div");
    const btn1 = document.createElement("button");
    const btn2 = document.createElement("button");
    div.append(btn1, btn2);
    document.body.appendChild(div);
    expect(focusNext(div, btn2, 1)).toBe(btn1);
    document.body.removeChild(div);
  });
  it("wraps around backward", () => {
    const div = document.createElement("div");
    const btn1 = document.createElement("button");
    const btn2 = document.createElement("button");
    div.append(btn1, btn2);
    document.body.appendChild(div);
    expect(focusNext(div, btn1, -1)).toBe(btn2);
    document.body.removeChild(div);
  });
  it("excludes disabled elements", () => {
    const div = document.createElement("div");
    const btn1 = document.createElement("button");
    const btn2 = document.createElement("button");
    btn2.setAttribute("disabled", "");
    div.append(btn1, btn2);
    document.body.appendChild(div);
    // from btn1 forward — btn2 is disabled so wraps back to btn1
    expect(focusNext(div, btn1, 1)).toBe(btn1);
    document.body.removeChild(div);
  });
});
