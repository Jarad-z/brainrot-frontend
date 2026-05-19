import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { AssistantMessage } from "./AssistantMessage";
import type { ClientMessage } from "@/lib/api/types";

const baseAuthor = { name: "Writer", handle: "writer" };

const textMsg: ClientMessage = {
  id: "a1",
  task_card_id: "t1",
  role: "agent",
  author_user_id: null,
  author_agent_id: "a1",
  content: {},
  task_run_id: "r1",
  seq: 1,
  metadata: {},
  created_at: "2026-05-16T10:00:00Z",
  parsed: { type: "assistant_text", payload: { text: "hello" } },
  meta: {},
};

const thinkMsg: ClientMessage = {
  ...textMsg,
  id: "a2",
  parsed: { type: "thinking", payload: { text: "let me think..." } },
};

describe("AssistantMessage", () => {
  it("renders assistant text content", () => {
    const { getByText } = render(
      <AssistantMessage msg={textMsg} taskId="t1" agent={baseAuthor} />,
    );
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("renders thinking collapsed by default", () => {
    const { getByText, container } = render(
      <AssistantMessage msg={thinkMsg} taskId="t1" agent={baseAuthor} />,
    );
    expect(getByText(/思考/)).toBeInTheDocument();
    // First line ellipsis hide; click expands
    const card = container.querySelector(".thinking-card");
    if (card) fireEvent.click(card);
  });
});
