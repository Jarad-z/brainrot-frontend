export class CodecError extends Error {
  readonly rawInput: string;
  constructor(message: string, rawInput: string) {
    super(message);
    this.name = "CodecError";
    this.rawInput = rawInput;
  }
}

export function decodeJSON<T = unknown>(b64: string): T {
  if (typeof b64 !== "string") {
    throw new CodecError("expected string", String(b64));
  }
  let raw: string;
  try {
    raw = atob(b64);
  } catch (e) {
    throw new CodecError(`invalid base64: ${(e as Error).message}`, b64);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new CodecError(`invalid JSON: ${(e as Error).message}`, b64);
  }
}

export function encodeJSON(value: unknown): string {
  return btoa(JSON.stringify(value));
}
