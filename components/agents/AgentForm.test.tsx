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
    });
  });
});
