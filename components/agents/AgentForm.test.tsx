import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentForm } from "./AgentForm";
import type { Runtime } from "@/lib/api/types";

// AgentForm calls useSession() to discover the caller's own runtime. We mock
// the session as user "u1" so the form auto-selects rt1 below.
vi.mock("@/hooks/useSession", () => ({
  useSession: () => ({
    data: { id: "u1", email: "u1@test", name: "U1", avatar_url: null },
    isPending: false,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const runtimes: Runtime[] = [
  {
    id: "rt1",
    workspace_id: "ws1",
    user_id: "u1",
    name: "alice's machine",
    host: "host-a",
    os: "darwin",
    arch: "arm64",
    online: true,
    last_heartbeat: "2026-05-18T00:00:00Z",
    capacity: 4,
    revoked: false,
    created_at: "2026-05-18T00:00:00Z",
  },
];

describe("AgentForm", () => {
  it("blocks submission when env JSON is invalid", () => {
    const onSubmit = vi.fn();
    renderWithClient(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={onSubmit}
        isSubmitting={false}
        submitError={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: "w" } });
    fireEvent.change(screen.getByLabelText(/显示名称/), { target: { value: "W" } });
    fireEvent.change(screen.getByLabelText(/环境变量/), { target: { value: "{bad json" } });
    fireEvent.blur(screen.getByLabelText(/环境变量/));
    expect(screen.getByText(/JSON 格式错误/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /创建/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits parsed JSON objects, not strings", () => {
    const onSubmit = vi.fn();
    renderWithClient(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={onSubmit}
        isSubmitting={false}
        submitError={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: "writer" } });
    fireEvent.change(screen.getByLabelText(/显示名称/), { target: { value: "Writer" } });
    fireEvent.change(screen.getByLabelText(/环境变量/), {
      target: { value: '{"KEY":"V"}' },
    });
    fireEvent.change(screen.getByLabelText(/启动参数/), {
      target: { value: '["--x"]' },
    });
    // MCP config textarea is found via the section's aria-label; the
    // section now uses "MCP" as title and the textarea has aria-label
    // m.mcpConfig = "MCP 配置（JSON 对象）".
    fireEvent.change(screen.getByLabelText(/MCP 配置/), { target: { value: "{}" } });

    fireEvent.click(screen.getByRole("button", { name: /创建/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0]?.[0];
    expect(arg).toMatchObject({
      handle: "writer",
      name: "Writer",
      runtime_id: "rt1",
      custom_env: { KEY: "V" },
      custom_args: ["--x"],
      mcp_config: {},
      // New plugin-tree fields default to empty so the daemon early-returns
      // without materializing a plugin dir.
      skills: [],
      commands: [],
      subagents: [],
      hooks: {},
    });
  });

  it("renders the four new collapsible sections (skills/commands/subagents/hooks)", () => {
    renderWithClient(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={vi.fn()}
        isSubmitting={false}
        submitError={null}
      />,
    );
    // <summary> elements expose the section title as accessible text.
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Commands")).toBeInTheDocument();
    expect(screen.getByText("Subagents")).toBeInTheDocument();
    expect(screen.getByText("Hooks")).toBeInTheDocument();
  });

  it("surfaces the Hooks safety warning", () => {
    renderWithClient(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={vi.fn()}
        isSubmitting={false}
        submitError={null}
      />,
    );
    const warning = screen.getByRole("alert");
    expect(warning.textContent).toMatch(/shell/);
    expect(warning.textContent).toMatch(/runtime/);
  });

  it("submits skills typed into the repeatable list", () => {
    const onSubmit = vi.fn();
    renderWithClient(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={onSubmit}
        isSubmitting={false}
        submitError={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: "writer" } });
    fireEvent.change(screen.getByLabelText(/显示名称/), { target: { value: "Writer" } });

    // Click "新增 skill" inside the Skills section.
    const addButtons = screen.getAllByRole("button", { name: /新增/ });
    const skillAdd = addButtons.find((b) => /skill/.test(b.textContent ?? ""));
    expect(skillAdd).toBeDefined();
    fireEvent.click(skillAdd!);

    fireEvent.change(screen.getByLabelText(/skill 1 name/), { target: { value: "ship" } });
    fireEvent.change(screen.getByLabelText(/skill 1 content/), {
      target: { value: "# ship\nbody" },
    });

    fireEvent.click(screen.getByRole("button", { name: /创建/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0]?.[0];
    expect(arg.skills).toEqual([
      { name: "ship", description: "", content: "# ship\nbody" },
    ]);
  });

  it("blocks submission on invalid Hooks JSON", () => {
    const onSubmit = vi.fn();
    renderWithClient(
      <AgentForm
        mode="create"
        runtimes={runtimes}
        onSubmit={onSubmit}
        isSubmitting={false}
        submitError={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: "writer" } });
    fireEvent.change(screen.getByLabelText(/显示名称/), { target: { value: "Writer" } });
    fireEvent.change(screen.getByLabelText(/^Hooks$/), {
      target: { value: "{bad json" },
    });
    fireEvent.blur(screen.getByLabelText(/^Hooks$/));

    fireEvent.click(screen.getByRole("button", { name: /创建/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
