export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string) {
    super(`${status} ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new ApiError(resp.status, body);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}
