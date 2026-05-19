import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchMessages, sendMessage } from "./messages";

const fetchSpy = vi.fn();

beforeEach(() => {
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});

describe("fetchMessages", () => {
  it("calls /tasks/{id}/messages and enriches each item", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "m1", task_card_id: "t1", role: "user",
          author_user_id: "u1", author_agent_id: null,
          content: { text: "hi", mentions: [] },
          task_run_id: null, seq: null, metadata: {},
          created_at: "2026-05-16T10:00:00Z",
        },
      ],
    });
    const list = await fetchMessages("task-1");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/tasks/task-1/messages"),
      expect.objectContaining({ credentials: "include" })
    );
    expect(list).toHaveLength(1);
    expect(list[0]!.parsed.type).toBe("user");
  });
});

describe("sendMessage", () => {
  it("POSTs { content: { text, mentions } } and returns { message, runs }", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        message: {
          id: "srv-1", task_card_id: "t1", role: "user",
          author_user_id: "u1", author_agent_id: null,
          content: { text: "hi", mentions: [] },
          task_run_id: null, seq: null, metadata: {},
          created_at: "2026-05-16T10:00:00Z",
        },
        runs: [],
      }),
    });
    const resp = await sendMessage("task-1", { text: "hi", mentions: [] });
    expect(resp.message.id).toBe("srv-1");
    expect(resp.runs).toEqual([]);
  });
});
