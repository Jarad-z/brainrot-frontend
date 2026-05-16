import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, ApiError } from "@/lib/api/client";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const result = await apiFetch<{ ok: boolean }>("/api/v1/me");
    expect(result).toEqual({ ok: true });
  });

  it("returns undefined on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const result = await apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
    expect(result).toBeUndefined();
  });

  it("throws ApiError on !ok with status and body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response("nope", { status: 401 }))));
    await expect(apiFetch("/api/v1/me")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      body: "nope",
    });
    await expect(apiFetch("/api/v1/me")).rejects.toBeInstanceOf(ApiError);
  });
});
