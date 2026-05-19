import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setArtifactExcluded } from "./artifacts";
import { ApiError } from "./client";

describe("setArtifactExcluded", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends PATCH with { excluded } body and resolves on 204", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await expect(setArtifactExcluded("art-1", true)).resolves.toBeUndefined();

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe("/api/v1/artifacts/art-1");
    expect(call?.[1]?.method).toBe("PATCH");
    expect(call?.[1]?.body).toBe(JSON.stringify({ excluded: true }));
  });

  it("throws ApiError on 403", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("forbidden", { status: 403 }),
    );

    await expect(setArtifactExcluded("art-1", true)).rejects.toBeInstanceOf(ApiError);
  });

  it("throws on network failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("offline"),
    );

    await expect(setArtifactExcluded("art-1", true)).rejects.toThrow("offline");
  });
});
