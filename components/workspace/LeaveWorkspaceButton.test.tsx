import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LeaveWorkspaceButton } from "./LeaveWorkspaceButton";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: pushMock, push: pushMock }),
}));

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("LeaveWorkspaceButton", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(window, "localStorage", {
      value: {
        store: { "brainrot.lastWsId": "ws-1" } as Record<string, string>,
        getItem(k: string) {
          return this.store[k] ?? null;
        },
        setItem(k: string, v: string) {
          this.store[k] = v;
        },
        removeItem(k: string) {
          delete this.store[k];
        },
        clear() {
          this.store = {};
        },
      },
      writable: true,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens confirm dialog and redirects on 204", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    renderWithClient(<LeaveWorkspaceButton wsId="ws-1" wsName="Acme" />);

    fireEvent.click(screen.getByRole("button", { name: "离开工作区" }));
    expect(screen.getByText(/确定要离开 Acme/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "离开" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
    expect(window.localStorage.getItem("brainrot.lastWsId")).toBeNull();
  });

  it("shows last-owner follow-up dialog on 409 and does not redirect", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("last owner", { status: 409 }),
    );
    renderWithClient(<LeaveWorkspaceButton wsId="ws-1" wsName="Acme" />);

    fireEvent.click(screen.getByRole("button", { name: "离开工作区" }));
    fireEvent.click(screen.getByRole("button", { name: "离开" }));

    await waitFor(() =>
      expect(
        screen.getByText(/你是这个工作区唯一的 owner/),
      ).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects with inline note on 403", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("not member", { status: 403 }),
    );
    renderWithClient(<LeaveWorkspaceButton wsId="ws-1" wsName="Acme" />);

    fireEvent.click(screen.getByRole("button", { name: "离开工作区" }));
    fireEvent.click(screen.getByRole("button", { name: "离开" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
  });
});
