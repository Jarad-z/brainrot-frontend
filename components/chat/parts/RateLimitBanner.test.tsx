import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RateLimitBanner } from "./RateLimitBanner";
import type { ClientMessage } from "@/lib/api/types";

const msg: ClientMessage = {
  id: "rl1",
  task_card_id: "t1",
  role: "system",
  author_user_id: null,
  author_agent_id: null,
  content: "",
  task_run_id: null,
  seq: null,
  metadata: "",
  created_at: "2026-05-16T10:00:00Z",
  parsed: { type: "rate_limit_event", payload: { retry_in_seconds: 30 } },
  meta: {},
};

describe("RateLimitBanner", () => {
  it("shows retry seconds", () => {
    const { getByText } = render(<RateLimitBanner msg={msg} />);
    expect(getByText(/30/)).toBeInTheDocument();
  });
});
