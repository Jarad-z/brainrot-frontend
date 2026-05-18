import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CancelRunButton } from "./CancelRunButton";
import * as client from "@/lib/api/client";

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CancelRunButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("does not render when busy=false", () => {
    wrap(<CancelRunButton taskId="t1" busy={false} />);
    expect(screen.queryByRole("button", { name: /取消运行/ })).not.toBeInTheDocument();
  });

  it("renders when busy=true and shows known-issue note in dialog", () => {
    wrap(<CancelRunButton taskId="t1" busy={true} />);
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    expect(screen.getByText(/已知后端问题/)).toBeInTheDocument();
    expect(screen.getByText(/重新发送/)).toBeInTheDocument();
  });

  it("posts cancel and locks button for 5s on confirm", async () => {
    const spy = vi.spyOn(client, "apiFetch").mockResolvedValue(undefined as never);
    wrap(<CancelRunButton taskId="t1" busy={true} />);
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    fireEvent.click(screen.getByRole("button", { name: /^确认/ }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("/api/v1/tasks/t1/cancel-run", { method: "POST" });
    });

    // Button is disabled during cooldown
    const btn = screen.getByRole("button", { name: /取消运行/ });
    expect(btn).toBeDisabled();

    // After 5s, button is re-enabled
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(btn).not.toBeDisabled();
  });

  it("ignores second click during cooldown", async () => {
    const spy = vi.spyOn(client, "apiFetch").mockResolvedValue(undefined as never);
    wrap(<CancelRunButton taskId="t1" busy={true} />);
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    fireEvent.click(screen.getByRole("button", { name: /^确认/ }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    // Try to open the dialog again while cooldown active:
    fireEvent.click(screen.getByRole("button", { name: /取消运行/ }));
    expect(screen.queryByText(/已知后端问题/)).not.toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
