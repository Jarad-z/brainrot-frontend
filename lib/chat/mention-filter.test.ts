import { describe, it, expect } from "vitest";
import { filterCandidates } from "./mention-filter";
import type { Agent } from "@/lib/api/types";

function mk(handle: string, archived = false): Agent {
  return {
    id: handle, workspace_id: "w1", runtime_id: "r1",
    handle, name: handle.toUpperCase(), avatar_url: null,
    description: "", instructions: "", backend_type: "claude",
    model: null, custom_env: {}, custom_args: [], mcp_config: {},
    archived, created_at: "", updated_at: "",
  };
}

describe("filterCandidates", () => {
  it("prefix match (case-insensitive)", () => {
    const agents = [mk("writer"), mk("Reviewer"), mk("rev2")];
    expect(filterCandidates("re", agents).map(a => a.handle)).toEqual(["Reviewer", "rev2"]);
  });

  it("filters out archived agents", () => {
    const agents = [mk("writer", true), mk("reviewer")];
    expect(filterCandidates("", agents).map(a => a.handle)).toEqual(["reviewer"]);
  });

  it("empty query returns first 10 active agents", () => {
    const agents = Array.from({ length: 15 }, (_, i) => mk(`a${i}`));
    expect(filterCandidates("", agents).length).toBe(10);
  });

  it("trims whitespace from query", () => {
    const agents = [mk("writer")];
    expect(filterCandidates("  wr  ", agents).length).toBe(1);
  });
});
