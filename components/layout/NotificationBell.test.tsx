import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { NotificationBell } from "./NotificationBell";
import * as meApi from "@/lib/api/me";

const pushMock = vi.fn();
const pathnameRef = { current: "/" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => pathnameRef.current,
}));

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("NotificationBell", () => {
  it("routes to /w/{wsId}/approvals when path is workspace-scoped", async () => {
    pushMock.mockReset();
    pathnameRef.current = "/w/ws-abc/p/p1";
    vi.spyOn(meApi, "fetchPendingApprovalsCount").mockResolvedValue(3);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<NotificationBell />, { wrapper: wrapper(qc) });
    fireEvent.click(screen.getByRole("button"));
    expect(pushMock).toHaveBeenCalledWith("/w/ws-abc/approvals");
  });

  it("routes to /approvals when path is top-level", () => {
    pushMock.mockReset();
    pathnameRef.current = "/approvals";
    vi.spyOn(meApi, "fetchPendingApprovalsCount").mockResolvedValue(0);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<NotificationBell />, { wrapper: wrapper(qc) });
    fireEvent.click(screen.getByRole("button"));
    expect(pushMock).toHaveBeenCalledWith("/approvals");
  });
});
