type Listener = (ev: MessageEvent<string>) => void;
type StatusFn = (status: "connecting" | "connected" | "offline") => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private retryDelay = 1000;
  private readonly MAX_DELAY = 30_000;
  private closedByUser = false;
  private listeners = new Set<Listener>();

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
}
