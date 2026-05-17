import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SystemLine } from "./SystemLine";
import type { ClientMessage } from "@/lib/api/types";

const msg: ClientMessage = {
  id: "s1",
  task_card_id: "t1",
  role: "system",
  author_user_id: null,
  author_agent_id: null,
  content: "",
  task_run_id: null,
  seq: null,
  metadata: "",
  created_at: "2026-05-16T10:00:00Z",
  parsed: { type: "system", payload: "Session started" },
  meta: {},
};

describe("SystemLine", () => {
  it("renders the payload text centered", () => {
    const { getByText } = render(<SystemLine msg={msg} />);
    expect(getByText("Session started")).toBeInTheDocument();
  });
});
