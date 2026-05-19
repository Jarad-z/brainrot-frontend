import { describe, it, expect } from "vitest";
import { screenshotFilename } from "./screenshot-filename";

describe("screenshotFilename", () => {
  it("formats from a Date with mime image/png", () => {
    const d = new Date("2026-05-19T15:30:22.123Z");
    expect(screenshotFilename(d, "image/png")).toBe(
      "screenshot-20260519-153022.png",
    );
  });

  it("uses jpg for image/jpeg", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    expect(screenshotFilename(d, "image/jpeg")).toBe(
      "screenshot-20260101-000000.jpg",
    );
  });

  it("falls back to png when mime is unrecognised", () => {
    const d = new Date("2026-05-19T15:30:22Z");
    expect(screenshotFilename(d, "image/webp")).toBe(
      "screenshot-20260519-153022.png",
    );
  });
});
