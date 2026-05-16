import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MentionedText } from "./MentionedText";

describe("MentionedText", () => {
  it("plain text renders unchanged", () => {
    const { getByText } = render(<MentionedText text="hello world" />);
    expect(getByText("hello world")).toBeInTheDocument();
  });

  it("renders single @mention as pill", () => {
    const { container } = render(<MentionedText text="hi @writer there" />);
    expect(container.querySelectorAll(".mention-pill").length).toBe(1);
    expect(container.textContent).toContain("writer");
  });

  it("renders multiple @mentions as separate pills", () => {
    const { container } = render(<MentionedText text="@writer and @coder" />);
    expect(container.querySelectorAll(".mention-pill").length).toBe(2);
  });
});
