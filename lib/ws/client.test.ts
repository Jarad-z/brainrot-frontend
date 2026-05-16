import { describe, it, expect, beforeEach, vi } from "vitest";
import { WSClient } from "./client";

class FakeSocket {
  static instances: FakeSocket[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((ev: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];
  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
}

beforeEach(() => {
  FakeSocket.instances.length = 0;
  vi.stubGlobal("WebSocket", FakeSocket as unknown as typeof WebSocket);
  (FakeSocket as unknown as { OPEN: number }).OPEN = 1;
});

describe("WSClient subscribe", () => {
  it("sends a subscribe frame and tracks the subscription", () => {
    const c = new WSClient("ws://x", () => {});
    c.connect();
    const sock = FakeSocket.instances[0]!;
    sock.open();
    c.subscribe("task", "tid-1");
    expect(sock.sent).toContain(
      JSON.stringify({ type: "subscribe", scope: "task", id: "tid-1" }),
    );
  });

  it("dedupes duplicate subscribe calls", () => {
    const c = new WSClient("ws://x", () => {});
    c.connect();
    const sock = FakeSocket.instances[0]!;
    sock.open();
    c.subscribe("task", "tid-1");
    c.subscribe("task", "tid-1");
    const subscribeFrames = sock.sent.filter((s) => s.includes("subscribe"));
    expect(subscribeFrames).toHaveLength(1);
  });

  it("unsubscribe sends frame and clears tracking", () => {
    const c = new WSClient("ws://x", () => {});
    c.connect();
    const sock = FakeSocket.instances[0]!;
    sock.open();
    c.subscribe("task", "tid-1");
    c.unsubscribe("task", "tid-1");
    expect(sock.sent).toContain(
      JSON.stringify({ type: "unsubscribe", scope: "task", id: "tid-1" }),
    );
  });

  it("resends all active subscriptions on reconnect", () => {
    const c = new WSClient("ws://x", () => {});
    c.connect();
    const sock1 = FakeSocket.instances[0]!;
    sock1.open();
    c.subscribe("task", "tid-1");
    c.subscribe("project", "pid-1");
    sock1.close();
    // backoff fires after 1s; advance timers
    vi.useFakeTimers();
    vi.advanceTimersByTime(1500);
    vi.useRealTimers();
    const sock2 = FakeSocket.instances[1];
    if (sock2) {
      sock2.open();
      const text = sock2.sent.join(",");
      expect(text).toContain('"id":"tid-1"');
      expect(text).toContain('"id":"pid-1"');
    }
  });
});
