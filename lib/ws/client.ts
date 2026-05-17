import type { Scope } from "./types";

type Listener = (ev: MessageEvent<string>) => void;
type StatusFn = (status: "connecting" | "connected" | "offline") => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private retryDelay = 1000;
  private readonly MAX_DELAY = 30_000;
  private closedByUser = false;
  private listeners = new Set<Listener>();
  private activeSubs = new Set<string>();

  constructor(
    private readonly url: string,
    private readonly onStatusChange: StatusFn,
  ) {}

  connect(): void {
    this.closedByUser = false;
    this.onStatusChange("connecting");
    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => {
      this.retryDelay = 1000;
      this.onStatusChange("connected");
      // Resubscribe to every currently-active scope+id after reconnect.
      for (const key of this.activeSubs) {
        const [scope, id] = this.splitKey(key);
        this.send({ type: "subscribe", scope, id });
      }
    };
    this.socket.onmessage = (ev) => {
      this.listeners.forEach((l) => l(ev));
    };
    this.socket.onclose = () => {
      this.onStatusChange("offline");
      if (this.closedByUser) return;
      const delay = this.retryDelay;
      this.retryDelay = Math.min(delay * 2, this.MAX_DELAY);
      setTimeout(() => this.connect(), delay);
    };
    this.socket.onerror = () => {
      // onclose follows; do not schedule here.
    };
  }

  send(payload: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  subscribe(scope: Scope, id: string): void {
    const key = this.makeKey(scope, id);
    if (this.activeSubs.has(key)) return;
    this.activeSubs.add(key);
    this.send({ type: "subscribe", scope, id });
  }

  unsubscribe(scope: Scope, id: string): void {
    const key = this.makeKey(scope, id);
    if (!this.activeSubs.has(key)) return;
    this.activeSubs.delete(key);
    this.send({ type: "unsubscribe", scope, id });
  }

  addListener(l: Listener): () => void {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }

  disconnect(): void {
    this.closedByUser = true;
    this.socket?.close();
    this.socket = null;
  }

  private makeKey(scope: Scope, id: string): string {
    return `${scope}:${id}`;
  }

  private splitKey(key: string): [Scope, string] {
    const idx = key.indexOf(":");
    return [key.slice(0, idx) as Scope, key.slice(idx + 1)];
  }
}
