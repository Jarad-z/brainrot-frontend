import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RepeatableSpecList } from "./RepeatableSpecList";
import type { SkillSpec } from "@/lib/api/types";

describe("RepeatableSpecList", () => {
  it("renders empty hint when no items", () => {
    render(
      <RepeatableSpecList
        itemLabel="skill"
        items={[]}
        onChange={vi.fn()}
        emptyHint="nothing here"
      />,
    );
    expect(screen.getByText("nothing here")).toBeInTheDocument();
  });

  it("calls onChange with a new blank item when add is clicked", () => {
    const onChange = vi.fn();
    render(<RepeatableSpecList itemLabel="skill" items={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /新增/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual([
      { name: "", description: "", content: "" },
    ]);
  });

  it("updates a row's name field via onChange", () => {
    const items: SkillSpec[] = [{ name: "old", description: "", content: "body" }];
    const onChange = vi.fn();
    render(<RepeatableSpecList itemLabel="skill" items={items} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/skill 1 name/), {
      target: { value: "new" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual([
      { name: "new", description: "", content: "body" },
    ]);
  });

  it("removes a row via the delete button", () => {
    const items: SkillSpec[] = [
      { name: "a", description: "", content: "" },
      { name: "b", description: "", content: "" },
    ];
    const onChange = vi.fn();
    render(<RepeatableSpecList itemLabel="skill" items={items} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Remove skill 1/ }));
    expect(onChange.mock.calls[0]?.[0]).toEqual([
      { name: "b", description: "", content: "" },
    ]);
  });

  it("disables add button when maxItems reached", () => {
    const items: SkillSpec[] = Array.from({ length: 2 }, (_, i) => ({
      name: `s${i}`,
      description: "",
      content: "",
    }));
    render(
      <RepeatableSpecList
        itemLabel="skill"
        items={items}
        onChange={vi.fn()}
        maxItems={2}
      />,
    );
    const btn = screen.getByRole("button", { name: /新增/ });
    expect(btn).toBeDisabled();
  });

  it("shows inline validation when name violates the regex", () => {
    const items: SkillSpec[] = [{ name: "BadName", description: "", content: "" }];
    render(<RepeatableSpecList itemLabel="skill" items={items} onChange={vi.fn()} />);
    expect(screen.getByText(/小写字母开头/)).toBeInTheDocument();
  });
});
