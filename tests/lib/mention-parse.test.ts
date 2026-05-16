import { describe, it, expect } from "vitest";
import { filterCandidates, parseSubmit, activePrefix } from "@/lib/mention-parse";

const agents = [
  { id: "1", handle: "writer" },
  { id: "2", handle: "Reviewer" },
  { id: "3", handle: "deployer", archived: true },
  { id: "4", handle: "writer-2" },
];

describe("filterCandidates", () => {
  it("returns all non-archived on empty prefix", () => {
    expect(filterCandidates("", agents)).toHaveLength(3);
  });

  it("filters by prefix case-insensitively", () => {
    expect(filterCandidates("WR", agents).map((a) => a.id)).toEqual(["1", "4"]);
  });

  it("excludes archived even when prefix matches", () => {
    expect(filterCandidates("dep", agents)).toEqual([]);
  });
});

describe("parseSubmit", () => {
  it("dedupes mention ids", () => {
    const result = parseSubmit(
      "hi @writer @writer",
      [{ id: "1", handle: "writer" }, { id: "1", handle: "writer" }],
    );
    expect(result).toEqual({ text: "hi @writer @writer", mentions: ["1"] });
  });
});

describe("activePrefix", () => {
  it("returns prefix when caret is in a mention", () => {
    expect(activePrefix("hi @wri", 7)).toBe("wri");
  });

  it("returns null when not in a mention", () => {
    expect(activePrefix("hi there", 5)).toBeNull();
  });

  it("returns null when @ is mid-word", () => {
    expect(activePrefix("foo@bar", 7)).toBeNull();
  });
});
