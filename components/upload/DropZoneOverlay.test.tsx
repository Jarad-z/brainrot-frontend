import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DropZoneOverlay } from "./DropZoneOverlay";

const pathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function dragEvent(type: string, types: string[], files: File[] = []) {
  const ev = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(ev, "dataTransfer", {
    value: { types, files } as unknown as DataTransfer,
  });
  return ev;
}

describe("DropZoneOverlay", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders overlay on dragenter when on a project route with Files", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-1/t/t-1");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["Files"]));
    });
    expect(screen.getByText("拖拽到任意位置上传")).toBeInTheDocument();
  });

  it("does NOT render overlay on dragenter when not on a project route", () => {
    pathnameMock.mockReturnValue("/approvals");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["Files"]));
    });
    expect(screen.queryByText("拖拽到任意位置上传")).toBeNull();
  });

  it("ignores non-file drags (text)", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-1");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["text/plain"]));
    });
    expect(screen.queryByText("拖拽到任意位置上传")).toBeNull();
  });

  it("hides overlay on dragleave when counter reaches zero", () => {
    pathnameMock.mockReturnValue("/w/ws-1/p/p-1/t/t-1");
    renderWithClient(<DropZoneOverlay />);
    act(() => {
      document.dispatchEvent(dragEvent("dragenter", ["Files"]));
    });
    expect(screen.getByText("拖拽到任意位置上传")).toBeInTheDocument();
    act(() => {
      document.dispatchEvent(dragEvent("dragleave", ["Files"]));
    });
    expect(screen.queryByText("拖拽到任意位置上传")).toBeNull();
  });
});
