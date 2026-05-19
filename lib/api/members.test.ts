import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { leaveWorkspace } from "./members";

describe("leaveWorkspace", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("DELETEs /workspaces/{ws}/members/me and resolves on 204", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await expect(leaveWorkspace("ws-1")).resolves.toBeUndefined();

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe("/api/v1/workspaces/ws-1/members/me");
    expect(call?.[1]?.method).toBe("DELETE");
  });

  it("throws ApiError 409 when last owner attempts to leave", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("last owner", { status: 409 }),
    );

    await expect(leaveWorkspace("ws-1")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
    });
  });

  it("throws ApiError 403 when caller isn't a member", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("not member", { status: 403 }),
    );

    await expect(leaveWorkspace("ws-1")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
    });
  });
});
