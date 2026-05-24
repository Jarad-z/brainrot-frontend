import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { MentionList, type MentionListHandle } from "./MentionList";
import type { Agent } from "@/lib/api/types";

function mk(id: string, handle: string): Agent {
  return {
    id,
    workspace_id: "w1",
    runtime_id: "r1",
    handle,
    name: handle.toUpperCase(),
    avatar_url: null,
    description: "",
    instructions: "",
    backend_type: "claude",
    model: null,
    custom_env: {},
    custom_args: [],
    mcp_config: {},
    skills: [],
    commands: [],
    subagents: [],
    hooks: {},
    archived: false,
    created_at: "",
    updated_at: "",
  };
}

const agents = [mk("a1", "writer"), mk("a2", "coder"), mk("a3", "qa")];
const rect = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
} as DOMRect;

function setup() {
  const onPick = vi.fn();
  const onClose = vi.fn();
  const ref = createRef<MentionListHandle>();
  render(
    <MentionList
      ref={ref}
      candidates={agents}
      anchorRect={rect}
      onPick={onPick}
      onClose={onClose}
    />,
  );
  return { onPick, onClose, ref };
}

describe("MentionList keyboard via forwardRef", () => {
  it("ArrowDown then Enter picks second candidate", () => {
    const { onPick, ref } = setup();
    expect(
      ref.current?.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowDown" })),
    ).toBe(true);
    expect(
      ref.current?.onKeyDown(new KeyboardEvent("keydown", { key: "Enter" })),
    ).toBe(true);
    expect(onPick).toHaveBeenCalledWith(agents[1]!);
  });

  it("Tab picks current highlight", () => {
    const { onPick, ref } = setup();
    expect(
      ref.current?.onKeyDown(new KeyboardEvent("keydown", { key: "Tab" })),
    ).toBe(true);
    expect(onPick).toHaveBeenCalledWith(agents[0]!);
  });

  it("Escape closes the popover", () => {
    const { onClose, ref } = setup();
    expect(
      ref.current?.onKeyDown(new KeyboardEvent("keydown", { key: "Escape" })),
    ).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it("ArrowUp wraps from 0 to last", () => {
    const { onPick, ref } = setup();
    expect(
      ref.current?.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowUp" })),
    ).toBe(true);
    expect(
      ref.current?.onKeyDown(new KeyboardEvent("keydown", { key: "Enter" })),
    ).toBe(true);
    expect(onPick).toHaveBeenCalledWith(agents[2]!);
  });

  it("unhandled key returns false", () => {
    const { ref } = setup();
    expect(
      ref.current?.onKeyDown(new KeyboardEvent("keydown", { key: "a" })),
    ).toBe(false);
  });
});
