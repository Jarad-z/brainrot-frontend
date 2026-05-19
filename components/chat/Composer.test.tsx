import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Composer } from "./Composer";

vi.mock("@/hooks/useWorkspaceAgents", () => ({
  useWorkspaceAgents: () => ({ data: [] }),
}));
vi.mock("@/hooks/useSendMessage", () => ({
  useSendMessage: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/useSession", () => ({
  useSession: () => ({ data: { ID: "u1", Email: "u@x", Name: "U" } }),
}));

function wrap(children: React.ReactNode) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("Composer", () => {
  it("renders the editor wrapper and footer hint", () => {
    const { getByText } = render(wrap(<Composer wsId="w1" taskId="t1" projectId="p1" />));
    expect(getByText(/Ctrl\+Enter/)).toBeInTheDocument();
  });
});
