import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { UserMessage } from "./UserMessage";
import type { ClientMessage } from "@/lib/api/types";

const msg: ClientMessage = {
  id: "u1",
  task_card_id: "t1",
  role: "user",
  author_user_id: "u1",
  author_agent_id: null,
  content: "",
  task_run_id: null,
  seq: null,
  metadata: "",
  created_at: "2026-05-16T10:00:00Z",
  parsed: { type: "user", text: "hi @writer", mentions: ["agent-1"] },
  meta: {},
};

describe("UserMessage", () => {
  it("renders user text with mention pill", () => {
    const { getByText, container } = render(
      <UserMessage msg={msg} authorName="Alice" authorHandle="alice" />,
    );
    expect(getByText("Alice")).toBeInTheDocument();
    expect(container.querySelector(".mention-pill")).toBeTruthy();
  });

  it("renders queued badge when meta.queued", () => {
    const queued: ClientMessage = { ...msg, meta: { queued: true } };
    const { getByText } = render(
      <UserMessage msg={queued} authorName="Alice" authorHandle="alice" />,
    );
    expect(getByText("排队中")).toBeInTheDocument();
  });
});
